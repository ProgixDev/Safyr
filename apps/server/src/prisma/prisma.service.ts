import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { ENV } from "@/config/env.module";
import type { Env } from "@/config/env";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Inject(ENV) env: Env) {
    super({
      adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Prisma connected");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private assertSafeToWipe(caller: string): void {
    // Le 26/09/2026, `bun test` a exécuté cette méthode contre la base de
    // production : `.env.test` (censé pointer sur une base jetable) n'a
    // jamais existé, donc dotenv retombait silencieusement sur `.env`, et
    // NODE_ENV=test (mis par défaut par `bun test`) suffisait à passer
    // l'ancien garde-fou. Toute la base a été vidée. Double protection
    // désormais : un jeton qui n'est JAMAIS présent dans .env/.env.local, et
    // un refus explicite si l'hôte ressemble à celui de production.
    if (process.env.NODE_ENV !== "test") {
      throw new Error(`${caller} only allowed in test environment`);
    }
    if (process.env.E2E_DB_RESET_TOKEN !== "yes-i-know-this-truncates-everything") {
      throw new Error(
        `${caller} refusé : la variable E2E_DB_RESET_TOKEN n'est pas positionnée. ` +
          "Elle doit être définie uniquement dans .env.test (jamais dans .env ou .env.local), " +
          "pour garantir qu'un lancement accidentel de `bun test` contre la base partagée " +
          "ne puisse plus jamais la vider.",
      );
    }
    const url = process.env.DATABASE_URL ?? "";
    if (/ep-soft-frost-am5dnjmt/i.test(url)) {
      throw new Error(
        `${caller} refusé : DATABASE_URL pointe vers l'hôte Neon de production connu. ` +
          "cleanDb/seedDb ne doivent jamais s'exécuter contre cette base.",
      );
    }
  }

  async cleanDb(): Promise<void> {
    this.assertSafeToWipe("cleanDb");

    const tablenames = await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations'`;

    const tables = tablenames
      .map(({ tablename }) => `"${tablename}"`)
      .join(", ");

    try {
      await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      this.logger.error("Error cleaning database", error);
      throw error;
    }
  }

  async seedDb(): Promise<void> {
    this.assertSafeToWipe("seedDb");

    const testEmail = "test@example.com";
    const testOrgSlug = "test-org";

    const user = await this.user.create({
      data: {
        id: "test-user-id",
        email: testEmail,
        name: "Test User",
        username: "testuser",
        displayUsername: "testuser",
        emailVerified: true,
      },
    });

    const org = await this.organization.create({
      data: {
        id: "test-org-id",
        name: "Test Org",
        slug: testOrgSlug,
        createdAt: new Date(),
      },
    });

    await this.member.create({
      data: {
        id: "test-member-id",
        organizationId: org.id,
        userId: user.id,
        role: "owner",
        createdAt: new Date(),
      },
    });
  }
}
