import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ENV } from "@/config/env.module";
import type { Env } from "@/config/env";
import { PrismaService } from "@/prisma/prisma.service";

const DEFAULT_PASSWORD = "Safyr2026!";

/**
 * Endpoint one-shot pour seeder la DB de production avec :
 * - une organisation Prodige Securite
 * - 5 comptes (2 owners + 3 agents) avec password "Safyr2026!"
 * - les document requirements
 *
 * Protégé par le header `x-admin-secret` = BETTER_AUTH_SECRET.
 * À appeler UNE seule fois après le premier deploy.
 */
@Controller("admin")
export class DevSeedController {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly prisma: PrismaService,
  ) {}

  private guard(secret?: string) {
    const expected = process.env.ADMIN_SEED_SECRET ?? this.env.BETTER_AUTH_SECRET;
    if (!secret || secret !== expected) {
      throw new ForbiddenException("Invalid admin secret");
    }
  }

  @Get("seed-demo")
  async seedDemo(@Headers("x-admin-secret") secret?: string) {
    this.guard(secret);

    const { hashPassword } = await import("better-auth/crypto");

    // Truncate everything to start fresh
    const tables = [
      "logbook_event",
      "shift",
      "post",
      "site",
      "time_entry",
      "document",
      "document_requirement",
      "certification",
      "member_bank_details",
      "member_address",
      "twoFactor",
      "invitation",
      "member",
      "organization",
      "representative",
      "account",
      "session",
      "verification",
      "user",
    ];
    for (const t of tables) {
      try {
        await this.prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE;`,
        );
      } catch {
        // table doesn't exist yet → skip
      }
    }

    const passwordHash = await hashPassword(DEFAULT_PASSWORD);
    const now = new Date();

    // Create organization
    const org = await this.prisma.organization.create({
      data: {
        id: randomUUID(),
        slug: "prodige-securite",
        name: "Prodige Securite",
        siret: "12345678900010",
        ape: "8010Z",
        address: "1 rue de la Sécurité, 75001 Paris",
        email: "contact@prodige-securite.fr",
        phone: "+33149667700",
        createdAt: now,
      },
    });

    type Seed = {
      email: string;
      name: string;
      role: "owner" | "agent";
      employeeNumber: string;
      position: string;
    };
    const seeds: Seed[] = [
      {
        email: "prodigesecurite@gmail.com",
        name: "Chaffa Belarbi",
        role: "owner",
        employeeNumber: "OWN001",
        position: "Gérant",
      },
      {
        email: "khalil3cheddadi@gmail.com",
        name: "Khalil Cheddadi",
        role: "owner",
        employeeNumber: "OWN002",
        position: "Co-Gérant",
      },
      {
        email: "marie.dupont@prodige-securite.fr",
        name: "Marie Dupont",
        role: "agent",
        employeeNumber: "AGT001",
        position: "Agent de sécurité",
      },
      {
        email: "thomas.martin@prodige-securite.fr",
        name: "Thomas Martin",
        role: "agent",
        employeeNumber: "AGT002",
        position: "Agent de sécurité",
      },
      {
        email: "sophie.leroy@prodige-securite.fr",
        name: "Sophie Leroy",
        role: "agent",
        employeeNumber: "AGT003",
        position: "Agent de sécurité",
      },
    ];

    for (const s of seeds) {
      const userId = randomUUID();
      const user = await this.prisma.user.create({
        data: {
          id: userId,
          email: s.email,
          name: s.name,
          emailVerified: true,
          updatedAt: now,
        },
      });

      await this.prisma.member.create({
        data: {
          id: randomUUID(),
          organizationId: org.id,
          userId: user.id,
          role: s.role,
          createdAt: now,
          firstName: s.name.split(" ")[0],
          lastName: s.name.split(" ").slice(1).join(" "),
          email: s.email,
          employeeNumber: s.employeeNumber,
          hireDate: new Date("2024-01-01"),
          position: s.position,
          contractType: "CDI",
          workSchedule: "full-time",
          status: "active",
        },
      });

      await this.prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    return {
      success: true,
      organizationId: org.id,
      accounts: seeds.map((s) => ({
        email: s.email,
        password: DEFAULT_PASSWORD,
        role: s.role,
      })),
      message: "DB seeded. Use any email + password to login.",
    };
  }
}
