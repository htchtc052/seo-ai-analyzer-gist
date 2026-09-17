import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { Queue } from "bullmq";

export const CRAWL_QUEUE = "crawl";
export type CrawlJob = { analysisId: string };

@Injectable()
export class CrawlQueueService {
  constructor(
    @InjectQueue(CRAWL_QUEUE)
    private readonly queue: Queue<CrawlJob>,
  ) {}

  async enqueue(analysisId: string): Promise<void> {
    await this.queue.add(
      "crawl-analysis",
      { analysisId },
      {
        jobId: analysisId,
        attempts: 1,
        removeOnComplete: true,
      },
    );
  }
}
