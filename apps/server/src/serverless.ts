import "reflect-metadata";

import type { IncomingMessage, ServerResponse } from "node:http";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "@/app.module";
import { loadEnv } from "@/config/env";
import { AppExceptionFilter } from "@/shared/filters/app-exception.filter";
import { EnvelopeInterceptor } from "@/shared/interceptors/envelope.interceptor";

/**
 * Vercel serverless handler for the NestJS API.
 * Compiled by `nest build` so the `@/...` aliases resolve at build time.
 */
let cachedApp: NestFastifyApplication | null = null;

async function bootstrap(): Promise<NestFastifyApplication> {
  if (cachedApp) return cachedApp;

  const env = loadEnv();

  const adapter = new FastifyAdapter({ logger: { level: env.LOG_LEVEL } });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { bufferLogs: true },
  );

  const { default: fastifyCors } = await import("@fastify/cors");
  await app.register(fastifyCors as never, {
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Organization-Id",
      "X-Requested-With",
      "Accept",
    ],
    exposedHeaders: ["set-cookie", "set-auth-token"],
  });

  app.setGlobalPrefix("api", { exclude: ["health"] });
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  app.useGlobalFilters(new AppExceptionFilter());

  const { default: fastifyMultipart } = await import("@fastify/multipart");
  await app.register(fastifyMultipart as never, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 100,
      fields: 10,
      fileSize: 10 * 1024 * 1024,
      files: 1,
      headerPairs: 2000,
    },
  });

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  cachedApp = app;
  return app;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const app = await bootstrap();
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.server.emit("request", req, res);
}
