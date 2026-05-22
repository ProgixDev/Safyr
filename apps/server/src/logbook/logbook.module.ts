import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { LogbookController } from "./logbook.controller";
import { LogbookService } from "./logbook.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [LogbookController],
  providers: [LogbookService],
  exports: [LogbookService],
})
export class LogbookModule {}
