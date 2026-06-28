import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { SubcontractorsController } from "./subcontractors.controller";
import { SubcontractorsService } from "./subcontractors.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ClientsController, SubcontractorsController],
  providers: [ClientsService, SubcontractorsService],
})
export class EntrepriseModule {}
