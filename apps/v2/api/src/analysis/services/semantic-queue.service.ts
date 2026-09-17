import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { Queue } from "bullmq";

export const SEMANTIC_QUEUE = "semantic-analysis";
export const EMBED_PAGE_JOB = "embed-page";
export const FINALIZE_SEMANTICS_JOB = "finalize-semantics";
export type EmbedPageJob = { analysisId: string; pageId: string };
type FinalizeSemanticsJob = { analysisId: string };
export type SemanticJob = EmbedPageJob | FinalizeSemanticsJob;

@Injectable()
export class SemanticQueueService {
  constructor(
    @InjectQueue(SEMANTIC_QUEUE)
    private readonly queue: Queue<SemanticJob>,
  ) {}

  async enqueuePages(analysisId: string, pageIds: string[]): Promise<void> {
    await this.queue.addBulk(
      pageIds.map((pageId) => ({
        name: EMBED_PAGE_JOB,
        data: { analysisId, pageId } satisfies EmbedPageJob,
        opts: {
          jobId: pageId,
          attempts: 1,
          removeOnComplete: true,
        },
      })),
    );
  }

  async enqueueFinalization(analysisId: string): Promise<void> {
    await this.queue.add(
      FINALIZE_SEMANTICS_JOB,
      { analysisId },
      {
        jobId: `${analysisId}-finalize`,
        attempts: 1,
        removeOnComplete: true,
      },
    );
  }
}
