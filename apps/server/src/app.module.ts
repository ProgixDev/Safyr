import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { EnvModule } from "./config/env.module";
import { EmailModule } from "./email/email.module";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { StorageModule } from "./storage/storage.module";
import { OrganizationModule } from "./organization/organization.module";
import { EmployeesModule } from "./employees/employees.module";
import { TimeEntriesModule } from "./time-entries/time-entries.module";
import { SitesModule } from "./sites/sites.module";
import { ShiftsModule } from "./shifts/shifts.module";
import { LogbookModule } from "./logbook/logbook.module";

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    EmailModule,
    AuthModule,
    StorageModule,
    OrganizationModule,
    EmployeesModule,
    TimeEntriesModule,
    SitesModule,
    ShiftsModule,
    LogbookModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
