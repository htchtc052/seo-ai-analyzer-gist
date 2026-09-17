import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AnalysisController } from "./controllers/analysis.controller.js";
import { AnalysisProcessor } from "./processors/analysis.processor.js";
import { AnalysisRepository } from "./repositories/analysis.repository.js";
import {
  AnalysisQueueService,
  ANALYSIS_QUEUE,
} from "./services/analysis-queue.service.js";
import { AnalysisService } from "./services/analysis.service.js";
import { AnalysisWorkflowService } from "./services/analysis-workflow.service.js";
import { SemanticComparisonService } from "./services/semantic-comparison.service.js";
import { EmbeddingsModule } from "../embeddings/embeddings.module.js";
import { PagesModule } from "../pages/pages.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SelectionModule } from "../selection/selection.module.js";

@Module({
  imports: [
    PrismaModule,
    PagesModule,
    EmbeddingsModule,
    SelectionModule,
    BullModule.registerQueue({ name: ANALYSIS_QUEUE }),
  ],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    AnalysisRepository,
    AnalysisWorkflowService,
    AnalysisQueueService,
    AnalysisProcessor,
    SemanticComparisonService,
  ],
})
export class AnalysisModule {}
