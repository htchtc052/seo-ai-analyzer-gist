import { Inject, Injectable } from "@nestjs/common";
import { FailureReason, PageSource } from "@prisma/client";
import { EmptyPageError, PageLoadError } from "../../pages/pages.types.js";
import { ContentExtractorService } from "../../pages/services/content-extractor.service.js";
import { PageClientService } from "../../pages/services/page-client.service.js";
import type { FragmentInput } from "../dto/analysis.types.js";
import { AnalysisRepository } from "../repositories/analysis.repository.js";
import { SelectionClientService } from "../../selection/services/selection-client.service.js";
import { SemanticComparisonService } from "./semantic-comparison.service.js";

const RECOMMENDATION_COUNT = 5;

@Injectable()
export class AnalysisWorkflowService {
  constructor(
    @Inject(AnalysisRepository)
    private readonly analyses: AnalysisRepository,
    @Inject(PageClientService)
    private readonly client: PageClientService,
    @Inject(ContentExtractorService)
    private readonly extractor: ContentExtractorService,
    @Inject(SemanticComparisonService)
    private readonly semantics: SemanticComparisonService,
    @Inject(SelectionClientService)
    private readonly selection: SelectionClientService,
  ) {}

  async embedPage(analysisId: string, pageId: string): Promise<boolean> {
    await this.analyses.markRunning(analysisId);
    const page = await this.analyses.findPage(pageId);
    if (!page || page.analysisId !== analysisId)
      throw new Error("Analysis page not found");
    if (page.embeddedAt)
      return (await this.analyses.countPendingPages(analysisId)) === 0;

    try {
      const { html } = await this.client.load(page.url);
      const { article } = this.extractor.extract(html);
      if (!article)
        throw new EmptyPageError("Found no readable article text", page.url);

      const fragments = toFragments(article.sections);
      if (fragments.length === 0)
        throw new EmptyPageError("Article has no usable paragraphs", page.url);

      const embedded = await this.semantics.embedPage(
        page.analysis.searchQuery,
        fragments,
      );
      return (
        (await this.analyses.savePage(pageId, article.title, embedded)) === 0
      );
    } catch (error) {
      if (page.source === PageSource.PRIMARY || !isPageFailure(error))
        throw error;
      return (await this.analyses.failPage(pageId, toFailure(error))) === 0;
    }
  }

  async finalize(id: string): Promise<void> {
    const { ours, theirs } = await this.analyses.findVectors(id);
    if (theirs.length === 0) throw new Error("Every competitor page failed");

    const similarities = this.semantics.similarities(ours, theirs);
    const gaps = new Map(
      similarities.map((entry) => [entry.id, entry.similarity]),
    );
    const candidates = theirs.map((fragment) => ({
      id: fragment.id,
      embedding: fragment.embedding,
      weight: toGap(fragment.relevance, gaps.get(fragment.id)),
    }));
    const selection = await this.selection.select(
      candidates,
      RECOMMENDATION_COUNT,
    );

    await this.analyses.complete(
      id,
      this.semantics.model,
      similarities,
      selection,
    );
  }

  async fail(id: string, error: Error): Promise<void> {
    await this.analyses.fail(id, toFailure(error));
  }
}

function toFragments(
  sections: Array<{ heading: string | null; paragraphs: string[] }>,
): FragmentInput[] {
  return sections.flatMap((section, sectionIndex) =>
    section.paragraphs.map((text, paragraphIndex) => ({
      sectionIndex,
      paragraphIndex,
      heading: section.heading,
      text,
    })),
  );
}

function toGap(
  relevance: number | null,
  similarity: number | undefined,
): number {
  return clamp(relevance ?? 0) * (1 - clamp(similarity ?? 0));
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function isPageFailure(
  error: unknown,
): error is EmptyPageError | PageLoadError {
  return error instanceof EmptyPageError || error instanceof PageLoadError;
}

function toFailure(error: Error) {
  if (error instanceof EmptyPageError)
    return {
      reason: FailureReason.EMPTY,
      url: error.url,
      detail: error.message,
    };
  if (error instanceof PageLoadError)
    return {
      reason: FailureReason.UNREACHABLE,
      url: error.url,
      detail: error.message,
    };
  return { reason: FailureReason.INTERNAL, url: null, detail: error.message };
}
