import { Readability } from "@mozilla/readability";
import { Injectable } from "@nestjs/common";
import { parseHTML } from "linkedom";
import type {
  ExtractedPage,
  ExtractedSection,
  PageDate,
} from "../pages.types.js";

const TEXT_BLOCKS = "h2, h3, p, li, blockquote, pre, div";
const CHROME_BLOCKS = "script, style, nav, header, footer, aside, form";
const MIN_PARAGRAPH_LENGTH = 40;
const MAX_PARAGRAPH_LENGTH = 800;
const MIN_ARTICLE_SHARE_OF_DOCUMENT = 0.5;

@Injectable()
export class ContentExtractorService {
  extract(html: string): ExtractedPage {
    const { document } = parseHTML(html);
    const publishedAt = toPublishedAt(document);
    const documentTitle = normalize(document.title ?? "");

    const article = new Readability(parseHTML(html).document).parse();
    const fromArticle = article?.content ? toSections(article.content) : [];
    const fromDocument = toSections(toStrippedBody(document));

    const sections =
      textLength(fromArticle) >=
      textLength(fromDocument) * MIN_ARTICLE_SHARE_OF_DOCUMENT
        ? fromArticle
        : fromDocument;
    if (sections.length === 0) return { article: null };

    return {
      article: {
        title: normalize(article?.title ?? "") || documentTitle,
        publishedAt,
        sections,
      },
    };
  }
}

const DATE_META: Array<[string, string]> = [
  ["article:published_time", 'meta[property="article:published_time"]'],
  ["itemprop datePublished", 'meta[itemprop="datePublished"]'],
  ["meta name=date", 'meta[name="date"]'],
  ["article:modified_time", 'meta[property="article:modified_time"]'],
  ["itemprop dateModified", 'meta[itemprop="dateModified"]'],
];

function toPublishedAt(document: Document): PageDate {
  for (const [source, selector] of DATE_META) {
    const date = toDate(
      document.querySelector(selector)?.getAttribute("content"),
    );
    if (date) return { date, source };
  }

  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    const date = fromLinkedData(script.textContent);
    if (date) return { date, source: "JSON-LD" };
  }

  const time = toDate(
    document.querySelector("time[datetime]")?.getAttribute("datetime"),
  );
  return time ? { date: time, source: "time datetime" } : null;
}

function fromLinkedData(source: string | null): Date | null {
  if (!source) return null;
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    return null;
  }

  const queue = [data];
  while (queue.length > 0) {
    const node = queue.shift();
    if (Array.isArray(node)) {
      queue.push(...node);
      continue;
    }
    if (!node || typeof node !== "object") continue;
    const record = node as Record<string, unknown>;
    const date =
      toDate(asText(record.datePublished)) ??
      toDate(asText(record.dateModified));
    if (date) return date;
    queue.push(...Object.values(record));
  }

  return null;
}

function asText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toSections(html: string): ExtractedSection[] {
  const { document } = parseHTML(
    `<!doctype html><html><body>${html}</body></html>`,
  );
  const sections: ExtractedSection[] = [];
  let current: ExtractedSection | undefined;

  for (const node of document.querySelectorAll(TEXT_BLOCKS)) {
    if (node.querySelector(TEXT_BLOCKS)) continue;
    const text = normalize(node.textContent ?? "");
    if (!text) continue;
    if (node.tagName === "H2" || node.tagName === "H3") {
      current = { heading: text, paragraphs: [] };
      sections.push(current);
      continue;
    }
    if (text.length < MIN_PARAGRAPH_LENGTH) continue;
    if (!current) {
      current = { heading: null, paragraphs: [] };
      sections.push(current);
    }
    current.paragraphs.push(...toParagraphs(text));
  }

  return sections.filter((section) => section.paragraphs.length > 0);
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function toStrippedBody(document: Document): string {
  for (const node of document.querySelectorAll(CHROME_BLOCKS)) node.remove();
  return document.body?.innerHTML ?? "";
}

function textLength(sections: ExtractedSection[]): number {
  return sections.reduce(
    (total, section) =>
      total +
      section.paragraphs.reduce(
        (length, paragraph) => length + paragraph.length,
        0,
      ),
    0,
  );
}

function toParagraphs(text: string): string[] {
  if (text.length <= MAX_PARAGRAPH_LENGTH) return [text];

  const parts: string[] = [];
  let current = "";
  for (const sentence of text.split(/(?<=[.!?\u2026])\s+/)) {
    if (current && current.length + sentence.length > MAX_PARAGRAPH_LENGTH) {
      parts.push(current);
      current = sentence;
      continue;
    }
    current = current ? `${current} ${sentence}` : sentence;
  }
  if (current) parts.push(current);
  return parts;
}
