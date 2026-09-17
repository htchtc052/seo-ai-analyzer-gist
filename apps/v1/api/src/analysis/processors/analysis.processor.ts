import { Inject } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import {
  ANALYSIS_QUEUE,
  type AnalysisJob,
} from "../constants/analysis.constants.js";
import { AnalysisService } from "../services/analysis.service.js";

@Processor(ANALYSIS_QUEUE)
export class AnalysisProcessor extends WorkerHost {
  constructor(
    @Inject(AnalysisService)
    private readonly analysis: AnalysisService,
  ) {
    super();
  }

  process(job: Job<AnalysisJob>): Promise<void> {
    return this.analysis.writeRecommendations(job.data.runId);
  }
}
