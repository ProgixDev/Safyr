import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { CommunicationController } from "./communication.controller";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CommunicationController],
})
export class CommunicationModule {}
