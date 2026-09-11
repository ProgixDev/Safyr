import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthGuard } from "@/auth/auth.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { EmailService } from "@/email/email.service";
import { parseOrThrow } from "@/common/parse-or-throw";
import { resolveOrgId } from "@/common/org-context";

const SendEmailSchema = z.object({
  recipients: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
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

    const dto = parseOrThrow(SendEmailSchema, body);
    const html = textToHtml(dto.body);

    // L'envoi reste techniquement fait depuis l'adresse de la plateforme,
    // mais les réponses arrivent sur l'adresse pro de l'entreprise si elle
    // en a renseigné une (fiche "Mon entreprise") : les destinataires
    // répondent ainsi directement à l'entreprise, pas à Safyr.
    const organisation = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { email: true },
    });
    const replyTo = organisation?.email || undefined;

    await Promise.all(
      dto.recipients.map((to) =>
        this.email.sendCustom({
          to,
          subject: dto.subject,
          html,
          meta: { archived: dto.saveInArchive ?? false },
          replyTo,
        }),
      ),
    );

    return { sent: dto.recipients.length };
  }
}
