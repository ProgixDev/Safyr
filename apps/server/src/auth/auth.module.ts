import { Global, Module } from "@nestjs/common";
import { ENV } from "@/config/env.module";
import type { Env } from "@/config/env";
import { EmailService } from "@/email/email.service";
import { PrismaService } from "@/prisma/prisma.service";
import { createAuth, type Auth } from "./auth.config";
import { AuthController } from "./auth.controller";
import { DevLoginController } from "./dev-login.controller";
import { AUTH } from "./auth.tokens";

export { AUTH };

@Global()
@Module({
  providers: [
    {
      provide: AUTH,
      inject: [ENV, PrismaService, EmailService],
      useFactory: (
        env: Env,
        prisma: PrismaService,
        email: EmailService,
      ): Auth => createAuth({ env, prisma, email }),
    },
  ],
  controllers: [AuthController, DevLoginController],
  exports: [AUTH],
})
export class AuthModule {}
