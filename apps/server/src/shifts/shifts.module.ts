import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { ShiftsController } from "./shifts.controller";
import { ShiftTemplatesController } from "./shift-templates.controller";
import { ShiftsService } from "./shifts.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ShiftsController, ShiftTemplatesController],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
