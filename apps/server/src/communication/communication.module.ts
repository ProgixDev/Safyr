import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { MailboxController } from "@/mailbox/mailbox.controller";
import { MailboxModule } from "@/mailbox/mailbox.module";
import { CommunicationController } from "./communication.controller";

@Module({
  imports: [AuthModule, PrismaModule, MailboxModule],
  controllers: [CommunicationController, MailboxController],
})
export class CommunicationModule {}
