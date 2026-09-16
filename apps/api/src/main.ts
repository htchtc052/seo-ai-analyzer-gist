import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { createApplication } from "./bootstrap.js";
import type { AppConfig } from "./config/config.schema.js";

const app = await createApplication();
const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
await app.listen(
  config.get("API_PORT", { infer: true }),
  config.get("API_HOST", { infer: true }),
);
