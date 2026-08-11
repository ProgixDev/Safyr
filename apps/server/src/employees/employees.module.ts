import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { StorageModule } from "@/storage/storage.module";
import { EmployeesController } from "./employees.controller";
import { EmployeesService } from "./employees.service";
import { ContractsController } from "./contracts.controller";
import { ContractsService } from "./contracts.service";

@Module({
  imports: [AuthModule, PrismaModule, StorageModule],
  controllers: [EmployeesController, ContractsController],
  providers: [EmployeesService, ContractsService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
