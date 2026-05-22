import "reflect-metadata";

import type { IncomingMessage, ServerResponse } from "node:http";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "../src/app.module";
import { loadEnv } from "../src/config/env";
import { AppExceptionFilter } from "../src/shared/filters/app-exception.filter";
import { EnvelopeInterceptor } from "../src/shared/interceptors/envelope.interceptor";

/**
 * Vercel serverless handler — boot NestJS once per Lambda cold start,
 * keep the Fastify instance warm between invocations.
 */

let cachedApp: NestFastifyApplication | null = null;

async function bootstrap(): Promise<NestFastifyApplication> {
  if (cachedApp) return cachedApp;

  const env = loadEnv();

  const adapter = new FastifyAdapter({
    logger: { level: env.LOG_LEVEL },
  });

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

  // Note: @fastify/rate-limit volontairement désactivé en serverless —
  // chaque cold start réinitialise son compteur, donc inefficace.
  // Utiliser Vercel Edge Middleware ou un service externe pour la prod.

  await app.init();

  // Forcer le boot complet du serveur Fastify sous-jacent
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
