import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { SitesController } from "./sites.controller";
import { SitesService } from "./sites.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [SitesService],
})
export class SitesModule {}
