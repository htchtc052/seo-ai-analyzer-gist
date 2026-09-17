import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import {
  ANALYSIS_QUEUE,
  AnalysisQueueService,
  EMBED_PAGE_JOB,
  FINALIZE_JOB,
  type AnalysisJob,
  type EmbedPageJob,
} from "../services/analysis-queue.service.js";
import { AnalysisWorkflowService } from "../services/analysis-workflow.service.js";

const PAGE_CONCURRENCY = 4;

@Processor(ANALYSIS_QUEUE, { concurrency: PAGE_CONCURRENCY })
export class AnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalysisProcessor.name);

  constructor(
    @Inject(AnalysisWorkflowService)
    private readonly workflow: AnalysisWorkflowService,
    @Inject(AnalysisQueueService)
    private readonly queue: AnalysisQueueService,
  ) {
    super();
  }

  async process(job: Job<AnalysisJob>): Promise<void> {
    if (job.name === EMBED_PAGE_JOB) {
      const data = job.data as EmbedPageJob;
      const ready = await this.workflow.embedPage(data.analysisId, data.pageId);
      if (ready) await this.queue.enqueueFinalization(data.analysisId);
      return;
    }
    if (job.name === FINALIZE_JOB) {
      await this.workflow.finalize(job.data.analysisId);
      return;
    }
    throw new Error(`Unknown analysis job: ${job.name}`);
  }

  @OnWorkerEvent("failed")
  async onFailed(
    job: Job<AnalysisJob> | undefined,
    error: Error,
  ): Promise<void> {
    this.logger.error(error.message);
    if (job) await this.workflow.fail(job.data.analysisId, error);
  }
}
