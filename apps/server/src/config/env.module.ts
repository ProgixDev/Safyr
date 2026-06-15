import { Global, Module } from "@nestjs/common";
import { loadEnv, type Env } from "./env";

// Token chaîne (et non Symbol) : robuste si le module est chargé via plusieurs
// chemins en prod compilée — sinon la DI casse ("Symbol(ENV) non résolu").
export const ENV = "APP_ENV";

@Global()
@Module({
  providers: [
    {
      provide: ENV,
      useFactory: (): Env => loadEnv(),
    },
  ],
  exports: [ENV],
})
export class EnvModule {}
