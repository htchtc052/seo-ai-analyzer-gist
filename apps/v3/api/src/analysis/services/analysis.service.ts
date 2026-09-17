import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AnalysisInputDto } from "../dto/analysis-input.schema.js";
import type {
  AnalysisReceipt,
  AnalysisRun,
  AnalysisSummary,
} from "../dto/analysis.types.js";
import { AnalysisRepository } from "../repositories/analysis.repository.js";
import { AnalysisQueueService } from "./analysis-queue.service.js";
import { AnalysisWorkflowService } from "./analysis-workflow.service.js";

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(AnalysisRepository)
    private readonly analyses: AnalysisRepository,
    @Inject(AnalysisWorkflowService)
    private readonly workflow: AnalysisWorkflowService,
    @Inject(AnalysisQueueService)
    private readonly queue: AnalysisQueueService,
  ) {}

  async analyze(input: AnalysisInputDto): Promise<AnalysisReceipt> {
    const { id, pageIds } = await this.analyses.create(input);
    try {
      await this.queue.enqueuePages(id, pageIds);
    } catch (error) {
      await this.workflow.fail(id, error as Error);
      throw error;
    }
    return { id, status: "queued" };
  }

  async find(id: string): Promise<AnalysisRun> {
    const run = await this.analyses.findById(id);
    if (!run) throw new NotFoundException("Analysis not found");
    return run;
  }

  list(): Promise<AnalysisSummary[]> {
    return this.analyses.list();
  }

  async delete(id: string): Promise<void> {
    if (!(await this.analyses.delete(id)))
      throw new NotFoundException("Analysis not found");
  }
}
