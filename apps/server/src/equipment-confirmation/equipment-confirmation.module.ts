import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import {
  EquipmentConfirmationController,
  PublicEquipmentConfirmationController,
} from "./equipment-confirmation.controller";
import { EquipmentConfirmationService } from "./equipment-confirmation.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [
    EquipmentConfirmationController,
    PublicEquipmentConfirmationController,
  ],
  providers: [EquipmentConfirmationService],
})
export class EquipmentConfirmationModule {}
