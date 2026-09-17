import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export const ANALYSIS_QUEUE = "analysis";
export const EMBED_PAGE_JOB = "embed-page";
export const FINALIZE_JOB = "finalize";

export type EmbedPageJob = { analysisId: string; pageId: string };
export type FinalizeJob = { analysisId: string };
export type AnalysisJob = EmbedPageJob | FinalizeJob;

@Injectable()
export class AnalysisQueueService {
  constructor(
    @InjectQueue(ANALYSIS_QUEUE)
    private readonly queue: Queue<AnalysisJob>,
  ) {}

  async enqueuePages(analysisId: string, pageIds: string[]): Promise<void> {
    await this.queue.addBulk(
      pageIds.map((pageId) => ({
        name: EMBED_PAGE_JOB,
        data: { analysisId, pageId },
      })),
    );
  }

  async enqueueFinalization(analysisId: string): Promise<void> {
    await this.queue.add(
      FINALIZE_JOB,
      { analysisId },
      // Двоеточие в идентификаторе работы BullMQ не принимает.
      { jobId: `${FINALIZE_JOB}-${analysisId}` },
    );
  }
}
