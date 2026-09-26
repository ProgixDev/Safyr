import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import { ENV } from "@/config/env.module";
import type { Env } from "@/config/env";
import { PrismaService } from "@/prisma/prisma.service";
import { EmailService } from "@/email/email.service";
import { DomainError } from "@/shared/errors/app-error";
import type { Prisma } from "generated/prisma/client";
import {
  deriveConfirmationKey,
  signConfirmationToken,
  verifyConfirmationToken,
  type ConfirmationPayload,
} from "./equipment-confirmation.token";

const RECORD_TYPE = "equipement";
export const PAGE_CONFIRMATION = "/confirmation-equipement";

export interface ConfirmationDetail {
  organizationName: string;
  employeeName: string;
  equipmentName: string;
  quantity: number | null;
  assignedAt: string | null;
  signed: boolean;
  signedAt: string | null;
}

type Meta = Record<string, unknown>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

@Injectable()
export class EquipmentConfirmationService {
  private readonly key: Buffer;

  constructor(
    @Inject(ENV) env: Env,
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {
    this.key = deriveConfirmationKey(env.BETTER_AUTH_SECRET);
  }

  /** Ligne d'équipement de l'organisation, ou erreur : jamais celle d'une autre. */
  private async loadRecord(orgId: string, recordId: string) {
    const record = await this.prisma.fiscalRecord.findFirst({
      where: { id: recordId, organizationId: orgId, type: RECORD_TYPE },
    });
    if (!record) {
      throw new DomainError(
        "LIEN_INTROUVABLE",
        "Cet équipement n'existe plus.",
        HttpStatus.NOT_FOUND,
      );
    }
    return record;
  }

  private decode(token: string): ConfirmationPayload {
    const result = verifyConfirmationToken(token, this.key);
    if (result.ok) return result.payload;
    if (result.error === "expired") {
      throw new DomainError(
        "LIEN_EXPIRE",
        "Ce lien de confirmation a expiré. Demandez à votre employeur de vous en renvoyer un.",
        HttpStatus.GONE,
      );
    }
    throw new DomainError(
      "LIEN_INVALIDE",
      "Ce lien de confirmation n'est pas valide.",
      HttpStatus.BAD_REQUEST,
    );
  }

  private async describe(
    orgId: string,
    recordId: string,
  ): Promise<{ detail: ConfirmationDetail; meta: Meta; status: string }> {
    const record = await this.loadRecord(orgId, recordId);
    const meta = (record.meta ?? {}) as Meta;
    const [organisation, membre] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      }),
      typeof meta.memberId === "string"
        ? this.prisma.member.findFirst({
            where: { id: meta.memberId, organizationId: orgId },
            select: { firstName: true, lastName: true },
          })
        : null,
    ]);
    const signature = meta.issuanceSignature as Meta | undefined;
    const quantite = Number(meta.quantity);
    return {
      status: record.status,
      meta,
      detail: {
        organizationName: organisation?.name ?? "Votre employeur",
        employeeName:
          [membre?.firstName, membre?.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() || "Salarié",
        equipmentName: asString(meta.name) ?? record.label,
        quantity: Number.isFinite(quantite) && quantite > 0 ? quantite : null,
        assignedAt: asString(meta.assignedAt),
        signed: Boolean(signature),
        signedAt: asString(signature?.signedAt),
      },
    };
  }

  /** Détail minimal affiché sur la page publique (aucune donnée sensible). */
  async detailByToken(token: string): Promise<ConfirmationDetail> {
    const payload = this.decode(token);
    return (await this.describe(payload.organizationId, payload.recordId))
      .detail;
  }

  /** Passe l'équipement à « Signé ». Idempotent. */
  async confirmByToken(
    token: string,
    client: { ip?: string; userAgent?: string },
  ): Promise<ConfirmationDetail> {
    const payload = this.decode(token);
    const { detail, meta, status } = await this.describe(
      payload.organizationId,
      payload.recordId,
    );
    if (detail.signed) return detail;
    if (status !== "assigned") {
      throw new DomainError(
        "REMISE_CLOTUREE",
        "Cette remise de matériel n'est plus en cours.",
        HttpStatus.CONFLICT,
      );
    }

    const signedAt = new Date().toISOString();
    // Mêmes champs que la confirmation manuelle de l'onglet Équipements.
    const issuanceSignature = {
      signedAt,
      signedBy: detail.employeeName,
      signatureData: "confirmed_by_email_link",
      ...(client.ip ? { ipAddress: client.ip.slice(0, 64) } : {}),
      ...(client.userAgent ? { device: client.userAgent.slice(0, 200) } : {}),
    };
    const res = await this.prisma.fiscalRecord.updateMany({
      where: {
        id: payload.recordId,
        organizationId: payload.organizationId,
        type: RECORD_TYPE,
      },
      data: {
        meta: { ...meta, issuanceSignature } as Prisma.InputJsonValue,
      },
    });
    if (res.count === 0) {
      throw new DomainError(
        "LIEN_INTROUVABLE",
        "Cet équipement n'existe plus.",
        HttpStatus.NOT_FOUND,
      );
    }
    return { ...detail, signed: true, signedAt };
  }

  /** Origine du site : uniquement http(s), sans chemin ni identifiants. */
  private parseOrigin(origin: string): string {
    const parsed = z.url().safeParse(origin);
    const url = parsed.success ? new URL(parsed.data) : null;
    if (!url || !["http:", "https:"].includes(url.protocol) || url.username) {
      throw new DomainError(
        "ORIGINE_INVALIDE",
        "Adresse du site invalide.",
        HttpStatus.BAD_REQUEST,
      );
    }
    return url.origin;
  }

  /** Envoie le mail de remise avec son lien de confirmation personnel. */
  async sendConfirmationEmail(
    orgId: string,
    input: { recordId: string; recipient: string; origin: string },
  ): Promise<{ sent: true }> {
    const origin = this.parseOrigin(input.origin);
    const { detail, meta } = await this.describe(orgId, input.recordId);

    const token = signConfirmationToken(
      { organizationId: orgId, recordId: input.recordId },
      this.key,
    );
    const url = `${origin}${PAGE_CONFIRMATION}?token=${token}`;

    const organisation = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { email: true, name: true },
    });
    const emailOrg = organisation?.email?.trim() ?? "";
    const replyTo = z.string().email().safeParse(emailOrg).success
      ? emailOrg
      : undefined;

    const prenom = detail.employeeName.split(" ")[0] ?? "";
    const html = this.renderHtml({
      prenom,
      societe: detail.organizationName,
      equipement: detail.equipmentName,
      serie: asString(meta.serialNumber),
      quantite: detail.quantity,
      url,
    });

    await this.email.sendCustom({
      to: input.recipient,
      subject: `Remise de matériel — ${detail.equipmentName}`,
      html,
      meta: { archived: false },
      replyTo,
      fromName: organisation?.name,
      organizationId: orgId,
    });

    // Repère « e-mail envoyé » : la fiche affiche « en attente de signature ».
    const ligne = await this.loadRecord(orgId, input.recordId);
    await this.prisma.fiscalRecord.updateMany({
      where: { id: ligne.id, organizationId: orgId, type: RECORD_TYPE },
      data: {
        meta: {
          ...((ligne.meta ?? {}) as Meta),
          emailEnvoye: true,
        } as Prisma.InputJsonValue,
      },
    });
    return { sent: true };
  }

  private renderHtml(p: {
    prenom: string;
    societe: string;
    equipement: string;
    serie: string | null;
    quantite: number | null;
    url: string;
  }): string {
    const lignes = [
      `<strong>${escapeHtml(p.equipement)}</strong>`,
      p.serie ? `N° de série : ${escapeHtml(p.serie)}` : null,
      p.quantite ? `Quantité : ${p.quantite}` : null,
    ]
      .filter(Boolean)
      .join("<br />");
    const lien = escapeHtml(p.url);
    return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;max-width:560px">
<p>Bonjour${p.prenom ? ` ${escapeHtml(p.prenom)}` : ""},</p>
<p>${escapeHtml(p.societe)} vous a remis le matériel suivant :</p>
<p style="background:#f1f5f9;border-radius:8px;padding:12px 16px">${lignes}</p>
<p>Merci de confirmer la réception en cliquant sur le bouton ci-dessous :</p>
<p style="margin:24px 0"><a href="${lien}" style="background:#0e7490;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;display:inline-block">Confirmer la réception</a></p>
<p style="font-size:12px;color:#64748b">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br /><a href="${lien}" style="color:#0e7490;word-break:break-all">${lien}</a></p>
<p style="font-size:12px;color:#64748b">Ce lien personnel est valable 30 jours.</p>
<p>Cordialement,<br />${escapeHtml(p.societe)}</p>
</div>`;
  }
}
