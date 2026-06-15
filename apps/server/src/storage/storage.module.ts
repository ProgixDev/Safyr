import { Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { StorageController } from "./storage.controller";
import { AuthModule } from "@/auth/auth.module";
import { EnvModule } from "@/config/env.module";

@Module({
  // Import explicite EnvModule : StorageService injecte ENV.
  imports: [AuthModule, EnvModule],
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
