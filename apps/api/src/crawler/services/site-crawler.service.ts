import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  EmptySiteError,
  PageLoadError,
  type CrawledSite,
  type PageLink,
} from "../crawler.types.js";
import { ContentExtractorService } from "./content-extractor.service.js";
import {
  CRAWLER_USER_AGENT,
  PageClientService,
} from "./page-client.service.js";
import { foldTerm } from "./query-terms.service.js";
import { RobotsService, type RobotRules } from "./robots.service.js";
import { SitemapService } from "./sitemap.service.js";

const VISITED_PAGE_FACTOR = 8;
const MIN_VISITED_PAGES = 40;
const MIN_CONTENT_LENGTH = 300;
const DEFAULT_CRAWL_DELAY_MS = 500;
const MIN_TOKEN_LENGTH = 3;
const MAX_SEEDED_URLS = 300;
const CANDIDATE_FACTOR = 3;
const MIN_PREFIX_LENGTH = 4;

type FrontierLink = {
  url: string;
  score: number;
};

@Injectable()
export class SiteCrawlerService {
  private readonly logger = new Logger(SiteCrawlerService.name);

  constructor(
    @Inject(PageClientService)
    private readonly client: PageClientService,
    @Inject(ContentExtractorService)
    private readonly extractor: ContentExtractorService,
    @Inject(RobotsService)
    private readonly robots: RobotsService,
    @Inject(SitemapService)
    private readonly sitemaps: SitemapService,
  ) {}

  async crawl(
    startUrl: string,
    maxPages: number,
    searchQuery: string,
    onPage: () => Promise<void>,
  ): Promise<CrawledSite> {
    const normalizedStartUrl = normalizeUrl(startUrl);
    const queryTokens = tokenize(searchQuery);
    const frontier: FrontierLink[] = [
      { url: normalizedStartUrl, score: Number.MAX_SAFE_INTEGER },
    ];
    const discovered = new Set([urlKey(normalizedStartUrl)]);
    const loadedUrls = new Set<string>();
    const seenContent = new Set<string>();
    const pages: CrawledSite["pages"] = [];
    let visited = 0;
    let origin = new URL(normalizedStartUrl).origin;
    let robots = await this.robots.load(origin);
    let crawlDelayMs = crawlDelay(robots);

    const corpus =
      queryTokens.length === 0
        ? []
        : await this.sitemaps.collect(origin, robots.getSitemaps());
    const weights = weighTerms(queryTokens, corpus);
    this.logger.log(
      `${origin}: term weights ${[...weights]
        .map(([term, weight]) => `${term}=${weight.toFixed(2)}`)
        .join(" ")}`,
    );
    for (const url of seedUrls(weights, corpus)) {
      const key = urlKey(url);
      if (discovered.has(key)) continue;
      discovered.add(key);
      frontier.push({ url, score: pathScore(weights, url) });
    }
    const maxVisitedPages = Math.max(
      MIN_VISITED_PAGES,
      maxPages * VISITED_PAGE_FACTOR,
    );

    const maxCandidates = maxPages * CANDIDATE_FACTOR;

    while (
      frontier.length > 0 &&
      visited < maxVisitedPages &&
      pages.length < maxCandidates
    ) {
      const next = takeBestLink(frontier);
      if (robots.isDisallowed(next.url, CRAWLER_USER_AGENT)) {
        this.logger.warn(`Disallowed by robots.txt: ${next.url}`);
        continue;
      }
      if (visited > 0) await wait(crawlDelayMs);
      visited += 1;

      try {
        const loaded = await this.client.load(next.url);
        const loadedUrl = normalizeUrl(loaded.url);

        if (visited === 1 && new URL(loadedUrl).origin !== origin) {
          origin = new URL(loadedUrl).origin;
          robots = await this.robots.load(origin);
          crawlDelayMs = crawlDelay(robots);
        }

        if (new URL(loadedUrl).origin !== origin) continue;
        const loadedKey = urlKey(loadedUrl);
        if (loadedUrls.has(loadedKey)) continue;
        loadedUrls.add(loadedKey);
        const extracted = this.extractor.extract(loaded.html, loadedUrl);

        for (const link of extracted.links) {
          const key = urlKey(link.url);
          if (new URL(link.url).origin !== origin || discovered.has(key))
            continue;
          discovered.add(key);
          frontier.push({ url: link.url, score: linkScore(weights, link) });
        }

        if (
          extracted.article &&
          contentLength(extracted.article.sections) >= MIN_CONTENT_LENGTH
        ) {
          const fingerprint = contentFingerprint(extracted.article.sections);
          if (!seenContent.has(fingerprint)) {
            seenContent.add(fingerprint);
            pages.push({ url: loadedUrl, ...extracted.article });
            await onPage();
          }
        }
      } catch (error) {
        if (!(error instanceof PageLoadError) || visited === 1) throw error;
        this.logger.warn(`Skipped ${next.url}: ${error.message}`);
      }
    }

    if (pages.length === 0) {
      throw new EmptySiteError(
        `Visited ${visited} pages without finding readable text`,
        normalizedStartUrl,
      );
    }

    const selected = pages
      .map((page) => ({ page, score: contentScore(weights, page) }))
      .toSorted((left, right) => right.score - left.score)
      .slice(0, maxPages)
      .map((candidate) => candidate.page);
    this.logger.log(
      `${origin}: kept ${selected.length} of ${pages.length} readable pages`,
    );

    return { startUrl, pages: selected };
  }
}

function seedUrls(weights: TermWeights, corpus: string[]): string[] {
  return corpus
    .map((url) => ({ url, score: pathScore(weights, url) }))
    .filter((candidate) => candidate.score > 0)
    .toSorted((left, right) => right.score - left.score)
    .slice(0, MAX_SEEDED_URLS)
    .map((candidate) => candidate.url);
}

function contentScore(
  weights: TermWeights,
  page: CrawledSite["pages"][number],
): number {
  const text = [
    page.title,
    ...page.sections.flatMap((section) => [
      section.heading ?? "",
      ...section.paragraphs,
    ]),
  ].join(" ");
  return matchScore(weights, tokenize(text));
}

type TermWeights = Map<string, number>;

function weighTerms(queryTokens: string[], corpus: string[]): TermWeights {
  const weights: TermWeights = new Map();
  if (corpus.length === 0) {
    for (const token of queryTokens) weights.set(token, 1);
    return weights;
  }

  const documents = corpus.map((url) => tokenize(new URL(url).pathname));
  for (const queryToken of queryTokens) {
    const frequency = documents.filter((document) =>
      document.some((token) => sameTerm(token, queryToken)),
    ).length;
    weights.set(queryToken, Math.log(corpus.length / (1 + frequency)));
  }
  return weights;
}

function matchScore(weights: TermWeights, tokens: string[]): number {
  let score = 0;
  for (const [queryToken, weight] of weights) {
    if (tokens.some((token) => sameTerm(token, queryToken))) score += weight;
  }
  return score;
}

function pathScore(weights: TermWeights, url: string): number {
  return matchScore(weights, tokenize(new URL(url).pathname));
}

function takeBestLink(frontier: FrontierLink[]): FrontierLink {
  let bestIndex = 0;
  for (let index = 1; index < frontier.length; index += 1) {
    if (frontier[index]!.score > frontier[bestIndex]!.score) bestIndex = index;
  }
  return frontier.splice(bestIndex, 1)[0]!;
}

function linkScore(weights: TermWeights, link: PageLink): number {
  return matchScore(
    weights,
    tokenize(`${link.text} ${new URL(link.url).pathname}`),
  );
}

function sameTerm(left: string, right: string): boolean {
  if (left === right) return true;
  const [shorter, longer] =
    left.length <= right.length ? [left, right] : [right, left];
  return shorter.length >= MIN_PREFIX_LENGTH && longer.startsWith(shorter);
}

function tokenize(value: string): string[] {
  return [
    ...new Set(
      value
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((token) => token.length >= MIN_TOKEN_LENGTH)
        .map(foldTerm)
        .filter((token) => token.length >= MIN_TOKEN_LENGTH),
    ),
  ];
}

function crawlDelay(robots: RobotRules): number {
  const seconds = robots.getCrawlDelay(CRAWLER_USER_AGENT);
  return seconds === undefined ? DEFAULT_CRAWL_DELAY_MS : seconds * 1_000;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

function urlKey(value: string): string {
  const url = new URL(value);
  return `${url.origin}${normalizePath(url.pathname)}${url.search}`;
}

function normalizePath(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

function contentFingerprint(
  sections: CrawledSite["pages"][number]["sections"],
): string {
  return sections
    .flatMap((section) => section.paragraphs)
    .join(" ")
    .slice(0, 400);
}

function contentLength(
  sections: CrawledSite["pages"][number]["sections"],
): number {
  return sections.reduce(
    (total, section) =>
      total +
      section.paragraphs.reduce((sum, paragraph) => sum + paragraph.length, 0),
    0,
  );
}
