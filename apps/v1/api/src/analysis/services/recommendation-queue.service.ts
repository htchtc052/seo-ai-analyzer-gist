import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import type { RecommendationJob } from "../dto/analysis-run.dto.js";
import {
  ANALYSIS_QUEUE,
  type AnalysisJob,
} from "../constants/analysis.constants.js";

@Injectable()
export class RecommendationQueueService {
  constructor(
    @InjectQueue(ANALYSIS_QUEUE)
    private readonly queue: Queue<AnalysisJob>,
  ) {}

  async enqueue(runId: string): Promise<void> {
    await this.queue.add("recommend", { runId }, { jobId: runId, attempts: 1 });
  }

  async getStatus(runId: string): Promise<RecommendationJob | null> {
    const job = await this.queue.getJob(runId);
    if (!job) return null;
    return {
      state: await job.getState(),
      failedReason: job.failedReason ?? null,
    };
  }

  async remove(runId: string): Promise<void> {
    await this.queue.remove(runId);
  }
}
