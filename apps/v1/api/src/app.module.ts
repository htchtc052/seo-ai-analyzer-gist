import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AnalysisModule } from "./analysis/analysis.module.js";
import { ArticlesModule } from "./articles/articles.module.js";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter.js";
import { ZodSerializerInterceptor } from "./common/interceptors/zod-serializer.interceptor.js";
import type { AppConfig } from "./config/config.schema.js";
import { ConfigModule } from "./config/config.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        connection: { url: config.get("REDIS_URL", { infer: true }) },
      }),
    }),
    HealthModule,
    ArticlesModule,
    AnalysisModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
