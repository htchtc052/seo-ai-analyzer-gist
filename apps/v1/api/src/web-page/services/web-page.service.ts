import { Inject, Injectable } from "@nestjs/common";
import {
  ArticleExtractorService,
  type ExtractedArticle,
} from "./article-extractor.service.js";
import { PageFetchException } from "../exceptions/page-fetch.exception.js";

const TIMEOUT_MS = 10_000;
const MAX_LENGTH = 5 * 1024 * 1024;

@Injectable()
export class WebPageService {
  constructor(
    @Inject(ArticleExtractorService)
    private readonly extractor: ArticleExtractorService,
  ) {}

  async readArticle(url: string): Promise<ExtractedArticle | null> {
    return this.extractor.extract(await this.fetchHtml(url));
  }

  private async fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(loadFailed);
    if (response.status !== 200)
      throw new PageFetchException(
        `The page responded with HTTP ${response.status}`,
      );

    const contentType = response.headers.get("content-type") ?? "";
    if (!/^(text\/html|application\/xhtml\+xml)\b/i.test(contentType)) {
      throw new PageFetchException(
        `Expected an HTML page, got ${contentType || "no content type"}`,
      );
    }

    const html = await response.text().catch(loadFailed);
    if (html.length > MAX_LENGTH)
      throw new PageFetchException("The page is larger than 5 MB");
    return html;
  }
}

function loadFailed(error: Error): never {
  const cause =
    error.cause instanceof Error ? error.cause.message : error.message;
  throw new PageFetchException(`Could not load the page: ${cause}`);
}
