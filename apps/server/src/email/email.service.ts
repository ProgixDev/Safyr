import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { render } from "@react-email/render";
import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "@/config/env.module";
import type { Env } from "@/config/env";
import { MagicLinkEmail } from "@/email/templates/magic-link";
import { OtpEmail } from "@/email/templates/otp";
import { MailboxService } from "@/mailbox/mailbox.service";
import {
  mailboxAuthFailed,
  mailboxNotConnected,
} from "@/mailbox/mailbox.errors";

export type DevEmailRecord = {
  to: string;
  subject: string;
  html: string;
  meta?: Record<string, unknown>;
  sentAt: string;
};

const DEV_INBOX_LIMIT = 50;

/**
 * Échec d'envoi traduit en message français exploitable à l'écran.
 * Sans cela, toute panne du transport SMTP remontait en « Erreur interne du
 * serveur » (500), sans aucune piste pour l'utilisateur.
 */
export class EmailDeliveryException extends HttpException {
  constructor(status: HttpStatus, code: string, message: string) {
    super({ code, message }, status);
  }
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transport: Transporter | null;
  private readonly isDev: boolean;
  private readonly devInbox: DevEmailRecord[] = [];

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly mailbox: MailboxService,
  ) {
    this.isDev = env.NODE_ENV === "development";
    this.transport = this.isDev
      ? null
      : nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
          // Délais courts : un serveur SMTP injoignable doit échouer avec un
          // message clair avant le délai d'attente de l'appel côté navigateur.
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 20_000,
        });
  }

  getDevInbox(filter?: { email?: string; limit?: number }): DevEmailRecord[] {
    const limit = filter?.limit ?? 20;
    const email = filter?.email?.toLowerCase();
    return this.devInbox
      .filter((r) => !email || r.to.toLowerCase() === email)
      .slice(-limit)
      .reverse();
  }

  async checkConnection(): Promise<{
    status: "up" | "down";
    error?: string;
  }> {
    if (this.isDev || !this.transport) {
      return { status: "up" };
    }
    try {
      await this.transport.verify();
      return { status: "up" };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "SMTP verification failed";
      this.logger.error(`SMTP health check failed: ${message}`);
      return {
        status: "down",
        error: message,
      };
    }
  }

  private logDevEmail(payload: {
    to: string;
    subject: string;
    html: string;
    meta?: Record<string, unknown>;
    replyTo?: string;
  }): void {
    this.logger.log(
      `[DEV] Email suppressed — to=${payload.to} subject="${payload.subject}"` +
        (payload.meta ? ` meta=${JSON.stringify(payload.meta)}` : ""),
    );
    this.logger.debug(`[DEV] HTML body:\n${payload.html}`);

    // Garde une "boîte de réception" en mémoire pour l'endpoint dev
    this.devInbox.push({ ...payload, sentAt: new Date().toISOString() });
    if (this.devInbox.length > DEV_INBOX_LIMIT) {
      this.devInbox.splice(0, this.devInbox.length - DEV_INBOX_LIMIT);
    }
  }

  /**
   * Envoi d'un email libre (centre de communication RH).
   * En développement, l'email est routé vers la boîte dev (non envoyé).
   */
  async sendCustom(params: {
    to: string;
    subject: string;
    html: string;
    meta?: Record<string, unknown>;
    /**
     * Adresse à laquelle les réponses doivent arriver. L'envoi passe
     * toujours par l'adresse SMTP de la plateforme (SMTP_FROM) : c'est ce
     * champ qui permet à une organisation d'être jointe sur sa propre
     * adresse professionnelle malgré tout.
     */
    replyTo?: string;
    /**
     * Nom affiché de l'expéditeur (typiquement le nom de l'entreprise) : le
     * destinataire voit « Prodige Sécurité » plutôt que « Safyr ». L'adresse
     * reste celle du compte SMTP, le fournisseur interdisant d'en usurper une
     * autre ; les réponses, elles, vont sur `replyTo`.
     */
    fromName?: string;
    /**
     * Organisation expéditrice. Si elle a connecté sa boîte mail, l'envoi
     * part de CETTE boîte (expéditeur et réponses = son adresse) ; sinon on
     * retombe sur le SMTP de la plateforme.
     */
    organizationId?: string;
  }): Promise<void> {
    const { to, subject, html, meta, replyTo, fromName, organizationId } =
      params;

    if (this.isDev || !this.transport) {
      this.logDevEmail({ to, subject, html, meta, replyTo });
      return;
    }

    const sender = organizationId
      ? await this.mailbox.getSender(organizationId)
      : null;
    if (sender) {
      const name = fromName?.replace(/["<>\r\n]/g, "").trim();
      try {
        await sender.transport.sendMail({
          from: name ? { name, address: sender.address } : sender.address,
          to,
          subject,
          html,
          replyTo: sender.address,
        });
      } catch (error) {
        throw this.toDeliveryException(error, to, {
          mailboxAddress: sender.address,
        });
      }
      return;
    }

    try {
      await this.transport.sendMail({
        from: this.buildFrom(fromName),
        to,
        subject,
        html,
        replyTo,
      });
    } catch (error) {
      throw this.toDeliveryException(error, to, {
        noMailbox: Boolean(organizationId),
      });
    }
  }

  /** Adresse d'envoi de la plateforme, avec le nom affiché de l'entreprise. */
  private buildFrom(
    fromName?: string,
  ): string | { name: string; address: string } {
    const configured = this.env.SMTP_FROM;
    const name = fromName?.replace(/["<>\r\n]/g, "").trim();
    if (!name) return configured;
    const address = /<([^>]+)>/.exec(configured)?.[1] ?? configured;
    return { name, address: address.trim() };
  }

  private toDeliveryException(
    error: unknown,
    to: string,
    ctx: { mailboxAddress?: string; noMailbox?: boolean } = {},
  ): HttpException {
    const e = (error ?? {}) as {
      code?: string;
      responseCode?: number;
      message?: string;
    };
    const detail = e.message ?? String(error);
    this.logger.error(
      `Envoi impossible vers ${to} — code=${e.code ?? "?"} smtp=${e.responseCode ?? "?"} : ${detail}`,
    );

    if (/quota|rate limit|too many/i.test(detail)) {
      return new EmailDeliveryException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "EMAIL_QUOTA_EXCEEDED",
        "La limite d'envoi d'e-mails du serveur est atteinte. Réessayez plus tard ou contactez le support.",
      );
    }
    const authRefused =
      e.code === "EAUTH" ||
      (e.responseCode !== undefined &&
        [530, 534, 535].includes(e.responseCode));
    // Boîte de la société refusée : elle doit la reconnecter. Compte de la
    // plateforme refusé : la société n'a simplement pas encore connecté la sienne.
    if (authRefused && ctx.mailboxAddress) {
      return mailboxAuthFailed(ctx.mailboxAddress);
    }
    if (authRefused && ctx.noMailbox) {
      return mailboxNotConnected();
    }
    if (authRefused) {
      return new EmailDeliveryException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "EMAIL_NOT_CONFIGURED",
        "L'envoi d'e-mail n'est pas configuré côté serveur (le compte d'envoi a été refusé par le fournisseur de messagerie). Contactez le support Safyr.",
      );
    }
    if (
      e.code !== undefined &&
      [
        "ECONNECTION",
        "ETIMEDOUT",
        "ESOCKET",
        "ECONNREFUSED",
        "ECONNRESET",
        "EDNS",
        "ENOTFOUND",
      ].includes(e.code)
    ) {
      return new EmailDeliveryException(
        HttpStatus.BAD_GATEWAY,
        "EMAIL_UNREACHABLE",
        "Le service d'envoi d'e-mails est momentanément injoignable. Réessayez dans quelques minutes ou contactez le support.",
      );
    }
    if (
      e.code === "EENVELOPE" ||
      (e.responseCode !== undefined &&
        e.responseCode >= 550 &&
        e.responseCode <= 554)
    ) {
      return new EmailDeliveryException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "EMAIL_RECIPIENT_REJECTED",
        `L'adresse « ${to} » a été refusée par le serveur de messagerie. Vérifiez qu'elle est correcte.`,
      );
    }
    return new EmailDeliveryException(
      HttpStatus.BAD_GATEWAY,
      "EMAIL_SEND_FAILED",
      "L'e-mail n'a pas pu être envoyé. Réessayez ou contactez le support.",
    );
  }

  async sendMagicLink(
    to: string,
    params: { url: string; expiresInMinutes?: number },
  ): Promise<void> {
    const expiresInMinutes = params.expiresInMinutes ?? 10;
    this.logger.log(`Magic link for ${to} → ${params.url}`);

    const html = await render(
      MagicLinkEmail({ url: params.url, expiresInMinutes }),
    );
    const subject = "Votre lien de connexion Safyr";

    if (this.isDev || !this.transport) {
      this.logDevEmail({
        to,
        subject,
        html,
        meta: { url: params.url, expiresInMinutes },
      });
      return;
    }

    await this.transport.sendMail({
      from: this.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }

  async sendOtp(
    to: string,
    otp: string,
    params?: {
      type?:
        "sign-in" | "email-verification" | "forget-password" | "change-email";
      expiresInMinutes?: number;
    },
  ): Promise<void> {
    const expiresInMinutes = params?.expiresInMinutes ?? 5;
    const type = params?.type ?? "sign-in";
    const html = await render(OtpEmail({ otp, type, expiresInMinutes }));
    const subject = "Votre code de connexion Safyr";

    if (this.isDev || !this.transport) {
      this.logDevEmail({
        to,
        subject,
        html,
        meta: { otp, type, expiresInMinutes },
      });
      return;
    }

    await this.transport.sendMail({
      from: this.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }
}
