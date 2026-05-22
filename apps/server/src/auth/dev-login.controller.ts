import {
  Body,
  Controller,
  Inject,
  NotFoundException,
  Post,
  Res,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { randomBytes } from "node:crypto";
import { ENV } from "@/config/env.module";
import type { Env } from "@/config/env";
import { PrismaService } from "@/prisma/prisma.service";

/**
 * Endpoint de connexion 1-clic — uniquement en NODE_ENV=development.
 * Crée une session better-auth directement en DB pour un user existant.
 * Le cookie est posé sur la réponse — l'utilisateur est immédiatement loggé.
 *
 * POST /api/dev/login-as { email: "..." }
 */
@Controller("dev/login-as")
export class DevLoginController {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly prisma: PrismaService,
  ) {}

  private guard() {
    if (this.env.NODE_ENV !== "development") {
      throw new NotFoundException();
    }
  }

  @Post()
  async loginAs(
    @Body() body: { email?: string },
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    this.guard();

    const email = body?.email?.trim().toLowerCase();
    if (!email) {
      throw new NotFoundException("email manquant");
    }

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (!user) {
      throw new NotFoundException(`Aucun user pour ${email}`);
    }

    // Récupère le premier org du user (pour activeOrganizationId)
    const member = await this.prisma.member.findFirst({
      where: { userId: user.id },
      select: { organizationId: true },
    });

    // Génère un token de session aléatoire et crée la session en DB
    const token = randomBytes(32).toString("base64url");
    const sessionId = `dev_${randomBytes(8).toString("hex")}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7j

    await this.prisma.session.create({
      data: {
        id: sessionId,
        token,
        userId: user.id,
        activeOrganizationId: member?.organizationId ?? null,
        expiresAt,
        createdAt: now,
        updatedAt: now,
        ipAddress: "127.0.0.1",
        userAgent: "dev-login",
      },
    });

    const isProd = (this.env.NODE_ENV as string) === "production";

    const attrs = [
      `better-auth.session_token=${encodeURIComponent(token)}`,
      "Path=/",
      "HttpOnly",
      `SameSite=${isProd ? "None" : "Lax"}`,
      `Max-Age=${60 * 60 * 24 * 7}`,
    ];
    if (isProd) attrs.push("Secure");

    reply.header("set-cookie", attrs.join("; "));

    return {
      user: { id: user.id, email: user.email, name: user.name },
      organizationId: member?.organizationId ?? null,
      sessionToken: token,
    };
  }
}
