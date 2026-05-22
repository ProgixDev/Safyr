import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { DevInboxController } from "./dev-inbox.controller";

@Global()
@Module({
  controllers: [DevInboxController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
