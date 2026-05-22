import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { EmailService } from "./email.service";
import { ENV } from "@/config/env.module";
import type { Env } from "@/config/env";
import { Inject } from "@nestjs/common";

/**
 * Boîte de réception dev — uniquement disponible en NODE_ENV=development.
 * Permet à un développeur de récupérer le dernier code OTP / magic link
 * envoyé à une adresse e-mail, sans avoir à fouiller les logs.
 */
@Controller("dev/inbox")
export class DevInboxController {
  constructor(
    private readonly email: EmailService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private guard() {
    if (this.env.NODE_ENV !== "development") {
      throw new NotFoundException();
    }
  }

  @Get()
  list(@Query("email") email?: string, @Query("limit") limit?: string) {
    this.guard();
    return this.email.getDevInbox({
      email,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });
  }

  @Get("last/:email")
  last(@Param("email") email: string) {
    this.guard();
    const inbox = this.email.getDevInbox({ email, limit: 1 });
    if (inbox.length === 0) {
      throw new NotFoundException("Aucun e-mail pour cette adresse");
    }
    const record = inbox[0];
    const meta = record.meta ?? {};
    return {
      to: record.to,
      subject: record.subject,
      sentAt: record.sentAt,
      otp: (meta as { otp?: string }).otp ?? null,
      magicLink: (meta as { url?: string }).url ?? null,
      meta,
    };
  }
}
