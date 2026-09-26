import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthGuard } from "@/auth/auth.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { parseOrThrow } from "@/common/parse-or-throw";
import { resolveOrgId } from "@/common/org-context";
import { EquipmentConfirmationService } from "./equipment-confirmation.service";

const SendSchema = z.object({
  recordId: z.string().min(1).max(64),
  recipient: z
    .string()
    .trim()
    .email("Adresse e-mail du destinataire invalide."),
  origin: z.string().min(1).max(200),
});

const TokenSchema = z.object({ token: z.string().min(1).max(1024) });

/** Côté équipe : envoi du mail de remise avec son lien de confirmation. */
@Controller("organization/equipment-confirmation")
@UseGuards(AuthGuard)
export class EquipmentConfirmationController {
  constructor(
    private readonly service: EquipmentConfirmationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("send")
  async send(@Req() req: FastifyRequest, @Body() body: unknown) {
    const dto = parseOrThrow(SendSchema, body);
    const orgId = await resolveOrgId(req, this.prisma);
    return this.service.sendConfirmationEmail(orgId, dto);
  }
}

/**
 * Côté salarié : volontairement SANS AuthGuard (le salarié n'a pas de compte),
 * le jeton signé tient lieu d'autorisation. La limite de débit globale du
 * serveur (@fastify/rate-limit, par IP) s'applique.
 */
@Controller("public/equipment-confirmation")
export class PublicEquipmentConfirmationController {
  constructor(private readonly service: EquipmentConfirmationService) {}

  @Get()
  detail(@Query() query: unknown) {
    const { token } = parseOrThrow(TokenSchema, query);
    return this.service.detailByToken(token);
  }

  @Post()
  confirm(@Req() req: FastifyRequest, @Body() body: unknown) {
    const { token } = parseOrThrow(TokenSchema, body);
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded)
        ?.split(",")[0]
        ?.trim() ||
      (req.headers["x-real-ip"] as string | undefined) ||
      req.ip;
    const userAgent = req.headers["user-agent"];
    return this.service.confirmByToken(token, { ip, userAgent });
  }
}
