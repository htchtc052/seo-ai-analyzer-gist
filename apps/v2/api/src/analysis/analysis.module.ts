import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { CrawlerModule } from "../crawler/crawler.module.js";
import { EmbeddingsModule } from "../embeddings/embeddings.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AnalysisController } from "./controllers/analysis.controller.js";
import { CrawlProcessor } from "./processors/crawl.processor.js";
import { SemanticProcessor } from "./processors/semantic.processor.js";
import { AnalysisRepository } from "./repositories/analysis.repository.js";
import { AnalysisService } from "./services/analysis.service.js";
import { AnalysisWorkflowService } from "./services/analysis-workflow.service.js";
import {
  CRAWL_QUEUE,
  CrawlQueueService,
} from "./services/crawl-queue.service.js";
import { SemanticComparisonService } from "./services/semantic-comparison.service.js";
import {
  SEMANTIC_QUEUE,
  SemanticQueueService,
} from "./services/semantic-queue.service.js";

@Module({
  imports: [
    CrawlerModule,
    EmbeddingsModule,
    PrismaModule,
    BullModule.registerQueue({ name: CRAWL_QUEUE }, { name: SEMANTIC_QUEUE }),
  ],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    AnalysisWorkflowService,
    AnalysisRepository,
    CrawlQueueService,
    CrawlProcessor,
    SemanticComparisonService,
    SemanticQueueService,
    SemanticProcessor,
  ],
})
export class AnalysisModule {}
