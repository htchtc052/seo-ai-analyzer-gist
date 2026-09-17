import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AnalysisModule } from "./analysis/analysis.module.js";
import type { AppConfig } from "./config/config.schema.js";
import { validateConfig } from "./config/config.schema.js";
import { HealthController } from "./health/health.controller.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        connection: { url: config.get("REDIS_URL", { infer: true }) },
      }),
    }),
    AnalysisModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
