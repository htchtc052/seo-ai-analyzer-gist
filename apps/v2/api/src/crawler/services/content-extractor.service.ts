import { Readability } from "@mozilla/readability";
import { Injectable } from "@nestjs/common";
import { parseHTML } from "linkedom";
import type {
  ExtractedPage,
  ExtractedSection,
  PageDate,
} from "../crawler.types.js";

const TEXT_BLOCKS = "h2, h3, p, li, blockquote, pre, div";
const MIN_PARAGRAPH_LENGTH = 40;

@Injectable()
export class ContentExtractorService {
  extract(html: string, pageUrl: string): ExtractedPage {
    const { document } = parseHTML(html);
    const links = Array.from(document.querySelectorAll("a[href]"), (link) => ({
      href: link.getAttribute("href"),
      text: normalize(link.textContent ?? ""),
    })).flatMap(({ href, text }) => {
      const url = href ? toUrl(href, pageUrl) : null;
      return url ? [{ url, text }] : [];
    });

    const publishedAt = toPublishedAt(document);
    const parsed = new Readability(document).parse();
    if (!parsed?.content) return { article: null, links };

    return {
      article: {
        title: normalize(parsed.title ?? ""),
        publishedAt,
        sections: toSections(parsed.content),
      },
      links,
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

function toUrl(href: string, pageUrl: string): string | null {
  try {
    const url = new URL(href, pageUrl);
    if (!/^https?:$/.test(url.protocol)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
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
    current.paragraphs.push(text);
  }

  return sections.filter((section) => section.paragraphs.length > 0);
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
