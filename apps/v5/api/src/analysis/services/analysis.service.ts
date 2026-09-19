import { randomUUID } from "node:crypto";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AnalysisInputDto } from "../dto/analysis-input.schema.js";
import type { AnalysisRun, ReadPage } from "../analysis.types.js";
import { AnalysisWorkflowService } from "./analysis-workflow.service.js";

@Injectable()
export class AnalysisService {
  private readonly runs = new Map<string, AnalysisRun>();

  constructor(
    @Inject(AnalysisWorkflowService)
    private readonly workflow: AnalysisWorkflowService,
  ) {}

  analyze(input: AnalysisInputDto): { id: string } {
    const id = randomUUID();
    this.progress(
      id,
      input.query,
      "loading",
      0,
      1 + input.competitorUrls.length,
    );
    void this.run(id, input);
    return { id };
  }

  find(id: string): AnalysisRun {
    const run = this.runs.get(id);
    if (!run) throw new NotFoundException("Analysis not found");
    return run;
  }

  private async run(id: string, input: AnalysisInputDto): Promise<void> {
    const urls = [input.url, ...input.competitorUrls];
    let done = 0;

    try {
      const pages = await Promise.all(
        urls.map(async (url, index): Promise<ReadPage> => {
          const page = await this.workflow.readPage(url, index === 0);
          done += 1;
          this.progress(id, input.query, "loading", done, urls.length);
          return page;
        }),
      );

      this.progress(id, input.query, "embedding", urls.length, urls.length);
      const report = await this.workflow.report(input.query, pages);

      this.runs.set(id, {
        id,
        query: input.query,
        status: "completed",
        ...report,
      });
    } catch (error) {
      this.runs.set(id, {
        id,
        query: input.query,
        status: "failed",
        detail: (error as Error).message,
      });
    }
  }

  private progress(
    id: string,
    query: string,
    stage: "loading" | "embedding",
    done: number,
    total: number,
  ): void {
    this.runs.set(id, {
      id,
      query,
      status: "running",
      stage,
      progress: { done, total },
    });
  }
}
