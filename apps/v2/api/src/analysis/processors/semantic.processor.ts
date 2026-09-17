import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import {
  EMBED_PAGE_JOB,
  FINALIZE_SEMANTICS_JOB,
  SEMANTIC_QUEUE,
  type EmbedPageJob,
  type SemanticJob,
} from "../services/semantic-queue.service.js";
import { AnalysisWorkflowService } from "../services/analysis-workflow.service.js";
import { SemanticQueueService } from "../services/semantic-queue.service.js";

const PAGE_CONCURRENCY = 4;

@Processor(SEMANTIC_QUEUE, { concurrency: PAGE_CONCURRENCY })
export class SemanticProcessor extends WorkerHost {
  private readonly logger = new Logger(SemanticProcessor.name);

  constructor(
    @Inject(AnalysisWorkflowService)
    private readonly workflow: AnalysisWorkflowService,
    @Inject(SemanticQueueService)
    private readonly queue: SemanticQueueService,
  ) {
    super();
  }

  async process(job: Job<SemanticJob>): Promise<void> {
    if (job.name === EMBED_PAGE_JOB) {
      const data = job.data as EmbedPageJob;
      const ready = await this.workflow.embedPage(data.analysisId, data.pageId);
      if (ready) await this.queue.enqueueFinalization(data.analysisId);
      return;
    }
    if (job.name === FINALIZE_SEMANTICS_JOB) {
      await this.workflow.finalizeSemantics(job.data.analysisId);
      return;
    }
    throw new Error(`Unknown semantic job: ${job.name}`);
  }

  @OnWorkerEvent("failed")
  async onFailed(
    job: Job<SemanticJob> | undefined,
    error: Error,
  ): Promise<void> {
    this.logger.error(error.message);
    if (job) await this.workflow.fail(job.data.analysisId, error);
  }
}
