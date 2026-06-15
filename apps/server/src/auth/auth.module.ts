import { Global, Module } from "@nestjs/common";
import { ENV, EnvModule } from "@/config/env.module";
import type { Env } from "@/config/env";
import { EmailService } from "@/email/email.service";
import { EmailModule } from "@/email/email.module";
import { PrismaService } from "@/prisma/prisma.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { createAuth, type Auth } from "./auth.config";
import { AuthController } from "./auth.controller";
import { DevLoginController } from "./dev-login.controller";
import { DevSeedController } from "./dev-seed.controller";
import { AUTH } from "./auth.tokens";

export { AUTH };

@Global()
@Module({
  // Imports explicites : ne pas dépendre uniquement de @Global (peu fiable en
  // prod compilée sous bun/Linux) pour résoudre ENV / PrismaService / EmailService.
  imports: [EnvModule, PrismaModule, EmailModule],
  providers: [
    {
      provide: AUTH,
      inject: [ENV, PrismaService, EmailService],
      useFactory: async (
        env: Env,
        prisma: PrismaService,
        email: EmailService,
      ): Promise<Auth> => createAuth({ env, prisma, email }),
    },
  ],
  controllers: [AuthController, DevLoginController, DevSeedController],
  exports: [AUTH],
})
export class AuthModule {}
