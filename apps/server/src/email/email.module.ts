import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { DevInboxController } from "./dev-inbox.controller";
import { EnvModule } from "../config/env.module";
import { MailboxModule } from "../mailbox/mailbox.module";

@Global()
@Module({
  // Import explicite : EmailService + DevInboxController injectent ENV.
  imports: [EnvModule, MailboxModule],
  controllers: [DevInboxController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
