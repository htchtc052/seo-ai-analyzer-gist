import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AnalysisInputDto } from "../dto/analysis-input.schema.js";
import type {
  AnalysisReceipt,
  AnalysisRun,
  AnalysisSummary,
} from "../dto/analysis.types.js";
import { AnalysisRepository } from "../repositories/analysis.repository.js";

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(AnalysisRepository)
    private readonly analyses: AnalysisRepository,
  ) {}

  async analyze(input: AnalysisInputDto): Promise<AnalysisReceipt> {
    return { id: await this.analyses.create(input), status: "queued" };
  }

  async find(id: string): Promise<AnalysisRun> {
    const run = await this.analyses.findById(id);
    if (!run) throw new NotFoundException("Анализ не найден");
    return run;
  }

  list(): Promise<AnalysisSummary[]> {
    return this.analyses.list();
  }

  async delete(id: string): Promise<void> {
    if (!(await this.analyses.delete(id)))
      throw new NotFoundException("Анализ не найден");
  }
}
