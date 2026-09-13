import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { StorageModule } from "@/storage/storage.module";
import { EmployeesController } from "./employees.controller";
import { EmployeesService } from "./employees.service";
import { ContractsController } from "./contracts.controller";
import { ContractsService } from "./contracts.service";
import { ContractExtractionController } from "./contract-extraction.controller";
import { ContractExtractionService } from "./contract-extraction.service";

@Module({
  imports: [AuthModule, PrismaModule, StorageModule],
  controllers: [
    EmployeesController,
    ContractsController,
    ContractExtractionController,
  ],
  providers: [EmployeesService, ContractsService, ContractExtractionService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
