import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { ExpensesController } from "./expenses.controller";
import { ExpensesService } from "./expenses.service";
import { VariablesController } from "./variables.controller";
import { VariablesService } from "./variables.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ExpensesController, VariablesController],
  providers: [ExpensesService, VariablesService],
})
export class PayrollModule {}
