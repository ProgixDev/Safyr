import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import type { Prisma } from "generated/prisma/client";
import { ENV } from "@/config/env.module";
import type { Env } from "@/config/env";
import { PrismaService } from "@/prisma/prisma.service";
import { MAILBOX_RECORD_TYPE } from "./mailbox.constants";
import {
  decryptSecret,
  deriveMailboxKey,
  encryptSecret,
} from "./mailbox.crypto";
import {
  describeConnectError,
  MailboxException,
  mailboxAuthFailed,
  type MailboxProvider,
} from "./mailbox.errors";
import {
  ALLOWED_SMTP_PORTS,
  isValidHostname,
  resolvesToPrivateAddress,
} from "./mailbox.host-guard";
import type { ConnectMailboxDto, MailboxStatus } from "./mailbox.schema";

const PRESETS: Record<
  Exclude<MailboxProvider, "autre">,
  { host: string; port: number; secure: boolean }
> = {
  gmail: { host: "smtp.gmail.com", port: 465, secure: true },
  outlook: { host: "smtp.office365.com", port: 587, secure: false },
  ovh: { host: "ssl0.ovh.net", port: 465, secure: true },
};

/** Contenu du champ `meta` de la ligne fiscal_record de type mailbox_config. */
interface StoredMailbox {
  email: string;
  provider: MailboxProvider;
  host: string;
  port: number;
  secure: boolean;
  /** v1:iv:tag:texte chiffré — ne quitte jamais ce service. */
  passwordEnc: string;
  lastVerifiedAt: string;
}

export interface OrgSender {
  transport: Transporter;
  address: string;
}

const CONNECT_MAX_ATTEMPTS = 5;
const CONNECT_WINDOW_MS = 10 * 60_000;
const TRANSPORT_CACHE_MAX = 200;

@Injectable()
export class MailboxService {
  private readonly logger = new Logger(MailboxService.name);
  private readonly key: Buffer;
  // Transports par organisation, indexés sur l'`updatedAt` de la ligne : une
  // reconnexion/déconnexion (même faite par une autre instance serverless)
  // change cette valeur et invalide l'entrée.
  private readonly transports = new Map<
    string,
    { version: number; sender: OrgSender }
  >();
  private readonly attempts = new Map<string, number[]>();

  constructor(
    @Inject(ENV) env: Env,
    private readonly prisma: PrismaService,
  ) {
    this.key = deriveMailboxKey(env.BETTER_AUTH_SECRET);
  }

  private findRecord(orgId: string) {
    return this.prisma.fiscalRecord.findFirst({
      where: { organizationId: orgId, type: MAILBOX_RECORD_TYPE },
      orderBy: { createdAt: "asc" },
    });
  }

  private readMeta(meta: unknown): StoredMailbox | null {
    if (!meta || typeof meta !== "object") return null;
    const m = meta as Partial<StoredMailbox>;
    if (
      typeof m.email !== "string" ||
      typeof m.host !== "string" ||
      typeof m.port !== "number" ||
      typeof m.passwordEnc !== "string"
    ) {
      return null;
    }
    return m as StoredMailbox;
  }

  /** État public : jamais de mot de passe, même chiffré. */
  async getStatus(orgId: string, canManage: boolean): Promise<MailboxStatus> {
    const record = await this.findRecord(orgId);
    const meta = record ? this.readMeta(record.meta) : null;
    if (!meta) return { connected: false, canManage };
    return {
      connected: true,
      canManage,
      email: meta.email,
      provider: meta.provider,
      host: meta.host,
      port: meta.port,
      secure: meta.secure,
      lastVerifiedAt: meta.lastVerifiedAt,
    };
  }

  private buildTransport(cfg: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  }): Transporter {
    return nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      // Sans SSL implicite, on exige STARTTLS : pas de mot de passe en clair.
      requireTLS: !cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    });
  }

  private assertNotThrottled(orgId: string): void {
    const now = Date.now();
    const recent = (this.attempts.get(orgId) ?? []).filter(
      (t) => now - t < CONNECT_WINDOW_MS,
    );
    if (recent.length >= CONNECT_MAX_ATTEMPTS) {
      throw new MailboxException(
        HttpStatus.TOO_MANY_REQUESTS,
        "MAILBOX_TOO_MANY_ATTEMPTS",
        "Trop de tentatives de connexion. Patientez quelques minutes avant de réessayer.",
      );
    }
    recent.push(now);
    this.attempts.set(orgId, recent);
  }

  async connect(
    orgId: string,
    dto: ConnectMailboxDto,
    canManage: boolean,
  ): Promise<MailboxStatus> {
    this.assertNotThrottled(orgId);

    const preset = dto.provider === "autre" ? null : PRESETS[dto.provider];
    const host = (preset?.host ?? dto.host ?? "").toLowerCase();
    const port = preset?.port ?? dto.port ?? 0;
    const secure = preset?.secure ?? dto.secure ?? port === 465;

    if (!isValidHostname(host)) {
      throw this.invalid("Le nom du serveur d'envoi est invalide.");
    }
    if (!ALLOWED_SMTP_PORTS.includes(port)) {
      throw this.invalid(
        `Le port ${port || "indiqué"} n'est pas accepté. Utilisez l'un des ports d'envoi usuels : ${ALLOWED_SMTP_PORTS.join(", ")}.`,
      );
    }
    if (!preset && (await resolvesToPrivateAddress(host))) {
      throw this.invalid(
        "Ce serveur n'est pas accessible : indiquez un serveur de messagerie public.",
      );
    }

    // Google affiche les mots de passe d'application par groupes de 4, avec espaces.
    const password =
      dto.provider === "gmail"
        ? dto.password.replace(/\s+/g, "")
        : dto.password;

    const transport = this.buildTransport({
      host,
      port,
      secure,
      user: dto.email,
      pass: password,
    });
    try {
      // Vérifié AVANT tout enregistrement : un échec ne sauvegarde rien.
      await transport.verify();
    } catch (error) {
      const e = error as { code?: string; responseCode?: number };
      this.logger.warn(
        `Vérification boîte mail refusée org=${orgId} fournisseur=${dto.provider} code=${e.code ?? "?"} smtp=${e.responseCode ?? "?"}`,
      );
      throw describeConnectError(error, { provider: dto.provider, host, port });
    } finally {
      transport.close();
    }

    const meta: StoredMailbox = {
      email: dto.email,
      provider: dto.provider,
      host,
      port,
      secure,
      passwordEnc: encryptSecret(password, this.key, orgId),
      lastVerifiedAt: new Date().toISOString(),
    };
    const data = {
      period: "config",
      label: dto.email,
      status: "connected",
      meta: meta as unknown as Prisma.InputJsonValue,
    };
    const existing = await this.findRecord(orgId);
    if (existing) {
      await this.prisma.fiscalRecord.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await this.prisma.fiscalRecord.create({
        data: { organizationId: orgId, type: MAILBOX_RECORD_TYPE, ...data },
      });
    }
    this.invalidate(orgId);
    this.logger.log(`Boîte mail connectée org=${orgId} (${dto.provider})`);
    return this.getStatus(orgId, canManage);
  }

  async disconnect(orgId: string, canManage: boolean): Promise<MailboxStatus> {
    await this.prisma.fiscalRecord.deleteMany({
      where: { organizationId: orgId, type: MAILBOX_RECORD_TYPE },
    });
    this.invalidate(orgId);
    this.logger.log(`Boîte mail déconnectée org=${orgId}`);
    return { connected: false, canManage };
  }

  private invalidate(orgId: string): void {
    this.transports.get(orgId)?.sender.transport.close();
    this.transports.delete(orgId);
  }

  /**
   * Transport d'envoi de la boîte connectée de l'organisation, ou `null` s'il
   * n'y en a pas. Lève MAILBOX_AUTH_FAILED si le secret stocké est illisible
   * (secret serveur changé) : la boîte est alors à reconnecter.
   */
  async getSender(orgId: string): Promise<OrgSender | null> {
    const record = await this.findRecord(orgId);
    const meta = record ? this.readMeta(record.meta) : null;
    if (!record || !meta) {
      this.invalidate(orgId);
      return null;
    }

    const version = record.updatedAt.getTime();
    const cached = this.transports.get(orgId);
    if (cached && cached.version === version) return cached.sender;

    let pass: string;
    try {
      pass = decryptSecret(meta.passwordEnc, this.key, orgId);
    } catch {
      this.logger.error(`Secret de la boîte mail illisible org=${orgId}`);
      throw mailboxAuthFailed(meta.email);
    }
    this.invalidate(orgId);
    const sender: OrgSender = {
      address: meta.email,
      transport: this.buildTransport({
        host: meta.host,
        port: meta.port,
        secure: meta.secure,
        user: meta.email,
        pass,
      }),
    };
    if (this.transports.size >= TRANSPORT_CACHE_MAX) {
      const oldest = this.transports.keys().next().value;
      if (oldest !== undefined) this.invalidate(oldest);
    }
    this.transports.set(orgId, { version, sender });
    return sender;
  }

  private invalid(message: string): MailboxException {
    return new MailboxException(
      HttpStatus.BAD_REQUEST,
      "VALIDATION_ERROR",
      message,
    );
  }
}
