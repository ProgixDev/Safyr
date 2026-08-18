import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { FiscalController } from "./fiscal.controller";
import { FiscalService } from "./fiscal.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [FiscalController],
  providers: [FiscalService],
})
export class FiscalModule {}
