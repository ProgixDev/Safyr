import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthGuard } from "@/auth/auth.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { EmailDeliveryException, EmailService } from "@/email/email.service";
import { resolveOrgId } from "@/common/org-context";

// Messages en français : le front les affiche tels quels (avant, un
// destinataire mal saisi remontait « Invalid input »).
const SendEmailSchema = z.object({
  recipients: z
    .array(
      z
        .string("Adresse e-mail du destinataire invalide.")
        .trim()
        .email("Adresse e-mail du destinataire invalide."),
    )
    .min(1, "Indiquez au moins un destinataire."),
  subject: z
    .string("L'objet du message est obligatoire.")
    .trim()
    .min(1, "L'objet du message est obligatoire."),
  body: z.string("Le message est vide.").trim().min(1, "Le message est vide."),
  saveInArchive: z.boolean().optional(),
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function textToHtml(body: string): string {
  const safe = escapeHtml(body).replace(/\n/g, "<br />");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">${safe}</div>`;
}

@Controller("organization/communication")
@UseGuards(AuthGuard)
export class CommunicationController {
  constructor(
    private readonly email: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("send-email")
  async sendEmail(@Req() req: FastifyRequest, @Body() body: unknown) {
    const orgId = await resolveOrgId(req, this.prisma);

    const parsed = SendEmailSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message:
          parsed.error.issues[0]?.message ??
          "Les informations saisies sont invalides.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    const dto = parsed.data;
    const html = textToHtml(dto.body);

    // L'envoi reste techniquement fait depuis l'adresse de la plateforme
    // (Gmail interdit d'usurper une autre adresse), mais le nom affiché est
    // celui de l'entreprise et les réponses arrivent sur son adresse pro
    // (fiche "Mon entreprise") : les destinataires répondent ainsi
    // directement à l'entreprise, pas à Safyr.
    const organisation = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { email: true, name: true },
    });
    const emailOrganisation = organisation?.email?.trim() ?? "";
    // Une adresse mal saisie dans la fiche ferait échouer tout l'envoi.
    const replyTo = z.string().email().safeParse(emailOrganisation).success
      ? emailOrganisation
      : undefined;

    const recipients = [...new Set(dto.recipients)];
    const results = await Promise.allSettled(
      recipients.map((to) =>
        this.email.sendCustom({
          to,
          subject: dto.subject,
          html,
          meta: { archived: dto.saveInArchive ?? false },
          replyTo,
          fromName: organisation?.name,
          organizationId: orgId,
        }),
      ),
    );

    const failures = results.flatMap((result, index) =>
      result.status === "rejected"
        ? [{ to: recipients[index], reason: result.reason as unknown }]
        : [],
    );
    const sent = recipients.length - failures.length;

    if (failures.length > 0) {
      // Aucun envoi réussi : on remonte l'erreur telle quelle (message clair
      // déjà en français). Envoi partiel : on précise qui n'a rien reçu.
      const premier = failures[0].reason;
      if (sent === 0 && premier instanceof Error) throw premier;
      throw new EmailDeliveryException(
        HttpStatus.BAD_GATEWAY,
        "EMAIL_PARTIAL_FAILURE",
        `L'e-mail n'a été envoyé qu'à ${sent} destinataire(s) sur ${recipients.length}. Échec pour : ${failures
          .map((f) => f.to)
          .join(", ")}.`,
      );
    }

    return { sent };
  }
}
