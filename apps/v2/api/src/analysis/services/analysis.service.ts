import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AnalysisReceipt,
  AnalysisRun,
  AnalysisSummary,
} from "../dto/analysis.types.js";
import type { AnalysisInputDto } from "../dto/analysis-input.schema.js";
import { AnalysisRepository } from "../repositories/analysis.repository.js";
import { CrawlQueueService } from "./crawl-queue.service.js";

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(AnalysisRepository)
    private readonly analyses: AnalysisRepository,
    @Inject(CrawlQueueService)
    private readonly crawlQueue: CrawlQueueService,
  ) {}

  async analyze(input: AnalysisInputDto): Promise<AnalysisReceipt> {
    const id = await this.analyses.create(input);
    try {
      await this.crawlQueue.enqueue(id);
    } catch (error) {
      await this.analyses.fail(id, { site: null, reason: "internal" });
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
