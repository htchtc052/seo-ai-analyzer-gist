import { Inject, Injectable } from "@nestjs/common";
import { EmptyPageError, PageLoadError } from "../../pages/pages.types.js";
import { ContentExtractorService } from "../../pages/services/content-extractor.service.js";
import { PageClientService } from "../../pages/services/page-client.service.js";
import { EmbeddingsService } from "../../embeddings/services/embeddings.service.js";
import { ComparisonService } from "./comparison.service.js";
import type {
  AnalysisReport,
  CompetitorPage,
  ReadPage,
} from "../analysis.types.js";

@Injectable()
export class AnalysisWorkflowService {
  constructor(
    @Inject(PageClientService)
    private readonly client: PageClientService,
    @Inject(ContentExtractorService)
    private readonly extractor: ContentExtractorService,
    @Inject(EmbeddingsService)
    private readonly embeddings: EmbeddingsService,
    @Inject(ComparisonService)
    private readonly comparison: ComparisonService,
  ) {}

  async report(query: string, pages: ReadPage[]): Promise<AnalysisReport> {
    const loaded = pages.filter((page) => page.status === "loaded");
    const our = loaded.find((page) => page.ours)!;
    const rivals = loaded.filter((page) => !page.ours);
    if (rivals.length === 0) throw new Error("Every competitor page failed");

    const queryVector = await this.embeddings.embedQuery(query);
    const ourVectors = await this.embeddings.embedPassages(
      our.paragraphs.map((paragraph) => paragraph.text),
    );
    const ourRelevance = this.comparison.relevance(queryVector, ourVectors);

    const competitors: CompetitorPage[] = [];
    for (const rival of rivals) {
      const vectors = await this.embeddings.embedPassages(
        rival.paragraphs.map((paragraph) => paragraph.text),
      );
      const relevance = this.comparison.relevance(queryVector, vectors);
      competitors.push({
        url: rival.url,
        domain: new URL(rival.url).hostname,
        title: rival.title,
        paragraphs: rival.paragraphs.map((paragraph, index) => ({
          ...paragraph,
          relevance: relevance[index]!,
        })),
        similarity: this.comparison.similarity(ourVectors, vectors),
      });
    }

    return {
      model: this.embeddings.model,
      ours: {
        url: our.url,
        title: our.title,
        paragraphs: our.paragraphs.map((paragraph, index) => ({
          ...paragraph,
          relevance: ourRelevance[index]!,
        })),
      },
      competitors,
      failed: pages
        .filter((page) => page.status === "failed")
        .map(({ url, reason, detail }) => ({ url, reason, detail })),
    };
  }

  async readPage(url: string, ours: boolean): Promise<ReadPage> {
    try {
      const { html } = await this.client.load(url);
      const { article } = this.extractor.extract(html);
      if (!article)
        throw new EmptyPageError("Found no readable article text", url);

      const paragraphs = toParagraphs(article.sections);
      if (paragraphs.length === 0)
        throw new EmptyPageError("Article has no usable paragraphs", url);

      return { url, ours, status: "loaded", title: article.title, paragraphs };
    } catch (error) {
      if (ours || !isPageFailure(error)) throw error;
      return {
        url,
        ours,
        status: "failed",
        reason: error instanceof EmptyPageError ? "empty" : "unreachable",
        detail: error.message,
      };
    }
  }
}

function toParagraphs(
  sections: Array<{ heading: string | null; paragraphs: string[] }>,
): Array<{ heading: string | null; text: string }> {
  return sections.flatMap((section) =>
    section.paragraphs.map((text) => ({ heading: section.heading, text })),
  );
}

function isPageFailure(
  error: unknown,
): error is EmptyPageError | PageLoadError {
  return error instanceof EmptyPageError || error instanceof PageLoadError;
}
