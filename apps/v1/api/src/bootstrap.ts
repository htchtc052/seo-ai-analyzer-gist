import { type INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";
import type { AppConfig } from "./config/config.schema.js";

export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  const config = app.get(ConfigService<AppConfig, true>);

  app.setGlobalPrefix("api");
  app.enableCors({ origin: config.get("WEB_ORIGIN", { infer: true }) });
  app.enableShutdownHooks();
  await app.init();

  return app;
}
