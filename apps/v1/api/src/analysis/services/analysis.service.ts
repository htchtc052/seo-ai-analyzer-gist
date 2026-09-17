import { readFileSync } from "node:fs";
import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type {
  AnalysisRun,
  AnalysisRunSummary,
  Features,
  FragmentScore,
  StartAnalysisDto,
} from "../dto/analysis-run.dto.js";
import { recommendationSchema } from "../dto/recommendation.dto.js";
import { ArticlesService } from "../../articles/services/articles.service.js";
import { LlmService } from "../../llm/services/llm.service.js";
import { AnalysisRunsRepository } from "../repositories/analysis-runs.repository.js";
import { RecommendationQueueService } from "./recommendation-queue.service.js";
import { RelevanceService } from "./relevance.service.js";

const recommendationPrompt = readFileSync(
  new URL("../prompts/recommendation.md", import.meta.url),
  "utf8",
);

type AnalysisRunRow = NonNullable<
  Awaited<ReturnType<AnalysisRunsRepository["findById"]>>
>;

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(ArticlesService)
    private readonly articles: ArticlesService,
    @Inject(AnalysisRunsRepository)
    private readonly runs: AnalysisRunsRepository,
    @Inject(LlmService)
    private readonly llm: LlmService,
    @Inject(RelevanceService)
    private readonly relevance: RelevanceService,
    @Inject(RecommendationQueueService)
    private readonly recommendationQueue: RecommendationQueueService,
  ) {}

  async startAnalysis(input: StartAnalysisDto): Promise<AnalysisRun> {
    if (input.competitorIds.length > 0 && this.llm.chatModel === undefined) {
      throw new UnprocessableEntityException({
        code: "RECOMMENDATIONS_DISABLED",
        message:
          "Recommendations are disabled on this server, so competitors cannot be added",
      });
    }
    const article = await this.articles.getArticle(input.articleId);
    await Promise.all(
      input.competitorIds.map((id) => this.articles.getArticle(id)),
    );

    const scores = await this.relevance.score(input.query, article.sections);
    const run = await this.runs.create(input, scores);
    if (input.competitorIds.length > 0) {
      await this.recommendationQueue.enqueue(run.id);
    }
    return this.getRun(run.id);
  }

  async getRun(id: string): Promise<AnalysisRun> {
    const run = await this.loadRun(id);
    return {
      id: run.id,
      article: toArticleRef(run.article),
      query: run.query,
      overallScore: this.relevance.overall(run.scores),
      recommendations: run.recommendations,
      recommendationJob:
        run.competitors.length > 0
          ? await this.recommendationQueue.getStatus(id)
          : null,
      createdAt: run.createdAt.toISOString(),
      competitors: run.competitors.map(toArticleRef),
      audience: run.audience,
      purpose: run.purpose,
      niche: run.niche,
      fragments: this.relevance.scoreFragments(
        run.article.sections,
        run.scores,
      ),
      missingEntities: run.missingEntities,
    };
  }

  getFeatures(): Features {
    return { recommendations: this.llm.chatModel !== undefined };
  }

  async listRecentRuns(): Promise<AnalysisRunSummary[]> {
    const runs = await this.runs.findRecent();
    return Promise.all(
      runs.map(async (run) => ({
        id: run.id,
        article: run.article,
        query: run.query,
        overallScore: this.relevance.overall(run.scores),
        competitorCount: run._count.competitors,
        recommendations: run.recommendations,
        recommendationJob:
          run._count.competitors > 0
            ? await this.recommendationQueue.getStatus(run.id)
            : null,
        createdAt: run.createdAt.toISOString(),
      })),
    );
  }

  async deleteRun(id: string): Promise<void> {
    await this.loadRun(id);
    await this.recommendationQueue.remove(id);
    await this.runs.delete(id);
  }

  async writeRecommendations(runId: string): Promise<void> {
    const run = await this.loadRun(runId);
    const prompt = renderRecommendationPrompt(
      run,
      this.relevance.scoreFragments(run.article.sections, run.scores),
    );
    await this.runs.saveRecommendation(
      runId,
      await this.llm.completeStructured(
        "recommendation",
        prompt,
        recommendationSchema,
      ),
    );
  }

  private async loadRun(id: string): Promise<AnalysisRunRow> {
    const run = await this.runs.findById(id);
    if (!run)
      throw new NotFoundException({
        code: "ANALYSIS_RUN_NOT_FOUND",
        message: "Analysis run not found",
      });
    return run;
  }
}

function toArticleRef({
  id,
  sourceUrl,
  title,
}: {
  id: string;
  sourceUrl: string;
  title: string;
}) {
  return { id, sourceUrl, title };
}

function renderRecommendationPrompt(
  run: AnalysisRunRow,
  fragments: FragmentScore[],
): string {
  const values: Record<string, string> = {
    query: run.query,
    audience: run.audience || "not specified",
    purpose: run.purpose || "not specified",
    niche: run.niche || "not specified",
    articleTitle: run.article.title,
    fragments: fragments
      .map(
        (fragment) =>
          `- [${fragment.score.toFixed(2)}] ${fragment.heading ? `${fragment.heading}: ` : ""}${fragment.text}`,
      )
      .join("\n"),
    competitors: run.competitors
      .map((competitor) => {
        const lines = competitor.sections
          .map(
            (section) =>
              `${section.heading ? `${section.heading}: ` : ""}${section.paragraphs.join(" ")}`,
          )
          .join("\n");
        return `### ${competitor.title}\n${lines}`;
      })
      .join("\n\n"),
  };
  return recommendationPrompt.replace(
    /\{\{(\w+)\}\}/g,
    (_, key: string) => values[key]!,
  );
}
