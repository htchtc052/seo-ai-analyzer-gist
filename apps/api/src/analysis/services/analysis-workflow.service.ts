import { Inject, Injectable } from "@nestjs/common";
import { EmptySiteError } from "../../crawler/crawler.types.js";
import { SiteCrawlerService } from "../../crawler/services/site-crawler.service.js";
import { AnalysisRepository } from "../repositories/analysis.repository.js";
import { SemanticComparisonService } from "./semantic-comparison.service.js";

export class SiteCrawlError extends Error {
  readonly reason: "unreachable" | "empty";

  constructor(
    readonly site: "primary" | "competitor",
    cause: Error,
  ) {
    super(`Could not crawl ${site} site: ${cause.message}`);
    this.reason = cause instanceof EmptySiteError ? "empty" : "unreachable";
  }
}

@Injectable()
export class AnalysisWorkflowService {
  constructor(
    @Inject(AnalysisRepository)
    private readonly analyses: AnalysisRepository,
    @Inject(SiteCrawlerService)
    private readonly crawler: SiteCrawlerService,
    @Inject(SemanticComparisonService)
    private readonly semanticComparison: SemanticComparisonService,
  ) {}

  async crawl(id: string): Promise<void> {
    const input = await this.analyses.findCrawlInput(id);
    await this.analyses.markCrawling(id);
    const [primary, competitor] = await Promise.all([
      this.crawlSite(id, "primary", input.primarySiteUrl, input),
      this.crawlSite(id, "competitor", input.competitorSiteUrl, input),
    ]);
    await this.analyses.saveCrawled(id, { primary, competitor });
  }

  prepareSemantics(id: string): Promise<string[]> {
    return this.analyses.markAnalyzing(id);
  }

  async embedPage(analysisId: string, pageId: string): Promise<boolean> {
    const page = await this.analyses.findPageForEmbedding(pageId);
    if (!page || page.analysisId !== analysisId)
      throw new Error("Analysis page not found");
    if (page.failed) return false;

    if (!page.embeddedAt) {
      const embedded = await this.semanticComparison.embedPage(
        page.searchQuery,
        page.fragments,
      );
      const remaining = await this.analyses.savePageEmbeddings(
        page.id,
        embedded,
      );
      return remaining === 0;
    }

    return (await this.analyses.countPendingPages(analysisId)) === 0;
  }

  async finalizeSemantics(id: string): Promise<void> {
    const vectors = await this.analyses.findVectors(id);
    const comparisons = this.semanticComparison.compare(
      vectors.primary,
      vectors.competitor,
    );
    await this.analyses.complete(
      id,
      this.semanticComparison.model,
      comparisons,
    );
  }

  async fail(id: string, error: Error): Promise<void> {
    await this.analyses.fail(
      id,
      error instanceof SiteCrawlError
        ? { site: error.site, reason: error.reason }
        : { site: null, reason: "internal" },
    );
  }

  private crawlSite(
    id: string,
    site: "primary" | "competitor",
    url: string,
    input: { maxPagesPerSite: number; searchQuery: string },
  ) {
    return this.crawler
      .crawl(url, input.maxPagesPerSite, input.searchQuery, async () => {
        await this.analyses.countCrawledPage(id);
      })
      .catch((error: Error) => {
        throw new SiteCrawlError(site, error);
      });
  }
}
