import { Module } from "@nestjs/common";
import { EmbeddingsModule } from "../embeddings/embeddings.module.js";
import { PagesModule } from "../pages/pages.module.js";
import { AnalysisController } from "./controllers/analysis.controller.js";
import { AnalysisService } from "./services/analysis.service.js";
import { AnalysisWorkflowService } from "./services/analysis-workflow.service.js";
import { ComparisonService } from "./services/comparison.service.js";

@Module({
  imports: [PagesModule, EmbeddingsModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, AnalysisWorkflowService, ComparisonService],
})
export class AnalysisModule {}
