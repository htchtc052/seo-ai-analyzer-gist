import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { AnalysisWorkflowService } from "../services/analysis-workflow.service.js";
import { CRAWL_QUEUE, type CrawlJob } from "../services/crawl-queue.service.js";
import { SemanticQueueService } from "../services/semantic-queue.service.js";

@Processor(CRAWL_QUEUE)
export class CrawlProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlProcessor.name);

  constructor(
    @Inject(AnalysisWorkflowService)
    private readonly workflow: AnalysisWorkflowService,
    @Inject(SemanticQueueService)
    private readonly semanticQueue: SemanticQueueService,
  ) {
    super();
  }

  async process(job: Job<CrawlJob>): Promise<void> {
    await this.workflow.crawl(job.data.analysisId);
    const pageIds = await this.workflow.prepareSemantics(job.data.analysisId);
    await this.semanticQueue.enqueuePages(job.data.analysisId, pageIds);
  }

  @OnWorkerEvent("failed")
  async onFailed(job: Job<CrawlJob> | undefined, error: Error): Promise<void> {
    this.logger.error(error.message);
    if (job) await this.workflow.fail(job.data.analysisId, error);
  }
}
