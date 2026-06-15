import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { EnvModule } from "../config/env.module";

@Global()
@Module({
  // Import explicite (au lieu de se reposer uniquement sur @Global d'EnvModule),
  // pour garantir la résolution de ENV en prod compilée.
  imports: [EnvModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
