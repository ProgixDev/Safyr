import { Inject, Injectable, Logger } from "@nestjs/common";
import { render } from "@react-email/render";
import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "@/config/env.module";
import type { Env } from "@/config/env";
import { MagicLinkEmail } from "@/email/templates/magic-link";
import { OtpEmail } from "@/email/templates/otp";

export type DevEmailRecord = {
  to: string;
  subject: string;
  html: string;
  meta?: Record<string, unknown>;
  sentAt: string;
};

const DEV_INBOX_LIMIT = 50;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transport: Transporter | null;
  private readonly isDev: boolean;
  private readonly devInbox: DevEmailRecord[] = [];

  constructor(@Inject(ENV) private readonly env: Env) {
    this.isDev = env.NODE_ENV === "development";
    this.transport = this.isDev
      ? null
      : nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
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
        | "sign-in"
        | "email-verification"
        | "forget-password"
        | "change-email";
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
