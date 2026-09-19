import { Module } from "@nestjs/common";
import { EnvModule } from "@/config/env.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { MailboxService } from "./mailbox.service";

/**
 * Le contrôleur HTTP est déclaré dans CommunicationModule : ce module-ci est
 * importé par EmailModule, qui ne peut pas dépendre d'AuthModule (cycle).
 */
@Module({
  imports: [EnvModule, PrismaModule],
  providers: [MailboxService],
  exports: [MailboxService],
})
export class MailboxModule {}
