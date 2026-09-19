import { Module } from "@nestjs/common";
import { AnalysisModule } from "./analysis/analysis.module.js";
import { ConfigModule } from "./config/config.module.js";
import { HealthController } from "./health/health.controller.js";

@Module({
  imports: [ConfigModule, AnalysisModule],
  controllers: [HealthController],
})
export class AppModule {}
