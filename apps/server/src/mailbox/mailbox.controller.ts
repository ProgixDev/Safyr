import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthGuard } from "@/auth/auth.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { requireUserId, resolveOrgId } from "@/common/org-context";
import { ConnectMailboxSchema } from "./mailbox.schema";
import { MailboxService } from "./mailbox.service";

const ADMIN_ROLES = ["owner", "admin"];

@Controller("organization/mailbox")
@UseGuards(AuthGuard)
export class MailboxController {
  constructor(
    private readonly mailbox: MailboxService,
    private readonly prisma: PrismaService,
  ) {}

  /** Organisation active + droit de gestion, après contrôle d'appartenance. */
  private async context(req: FastifyRequest) {
    const orgId = await resolveOrgId(req, this.prisma);
    const member = await this.prisma.member.findFirst({
      where: { organizationId: orgId, userId: requireUserId(req) },
      select: { role: true },
    });
    if (!member) {
      throw new ForbiddenException("Vous n'appartenez pas à cette société.");
    }
    // better-auth peut stocker plusieurs rôles séparés par une virgule.
    const canManage = member.role
      .split(",")
      .some((r) => ADMIN_ROLES.includes(r.trim()));
    return { orgId, canManage };
  }

  private async adminContext(req: FastifyRequest) {
    const ctx = await this.context(req);
    if (!ctx.canManage) {
      throw new ForbiddenException(
        "Seul un propriétaire ou un administrateur de la société peut gérer la boîte mail.",
      );
    }
    return ctx;
  }

  // Lecture ouverte à tous les membres (adresse d'expédition affichée dans les
  // formulaires) : la réponse ne contient aucun secret.
  @Get()
  async status(@Req() req: FastifyRequest) {
    const { orgId, canManage } = await this.context(req);
    return this.mailbox.getStatus(orgId, canManage);
  }

  @Put()
  async connect(@Req() req: FastifyRequest, @Body() body: unknown) {
    const { orgId, canManage } = await this.adminContext(req);
    const parsed = ConnectMailboxSchema.safeParse(body);
    if (!parsed.success) {
      // Pas de `details` : ils pourraient reprendre la valeur saisie.
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message:
          parsed.error.issues[0]?.message ??
          "Les informations saisies sont invalides.",
      });
    }
    return this.mailbox.connect(orgId, parsed.data, canManage);
  }

  @Delete()
  async disconnect(@Req() req: FastifyRequest) {
    const { orgId, canManage } = await this.adminContext(req);
    return this.mailbox.disconnect(orgId, canManage);
  }
}
