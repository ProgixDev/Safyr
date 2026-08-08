import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { loadEnv } from "./config/env";
import { AppExceptionFilter } from "./shared/filters/app-exception.filter";
import { EnvelopeInterceptor } from "./shared/interceptors/envelope.interceptor";
import { CORS_OPTIONS, buildCorsOriginMatcher } from "./shared/cors";

async function bootstrap(): Promise<void> {
  const env = loadEnv();

  const adapter = new FastifyAdapter({ logger: { level: env.LOG_LEVEL } });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    {
      bufferLogs: true,
    },
  );

  const { default: fastifyCors } = await import("@fastify/cors");
  await app.register(fastifyCors as never, {
    ...CORS_OPTIONS,
    origin: buildCorsOriginMatcher(env.ALLOWED_ORIGINS),
    exposedHeaders: ["set-cookie"],
  });

  app.setGlobalPrefix("api", { exclude: ["health"] });
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  app.useGlobalFilters(new AppExceptionFilter());

  const { default: fastifyRateLimit } = await import("@fastify/rate-limit");
  await app.register(fastifyRateLimit as never, {
    max: 100,
    timeWindow: "1 minute",
  });

  const { default: fastifyMultipart } = await import("@fastify/multipart");
  await app.register(fastifyMultipart as never, {
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 100, // Max field value size in bytes
      fields: 10, // Max number of non-file fields
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1, // Max number of file fields
      headerPairs: 2000, // Max number of header key=>value pairs
    },
  });

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  Logger.log(
    `Safyr server listening on http://localhost:${env.PORT}`,
    "Bootstrap",
  );
}

void bootstrap();
