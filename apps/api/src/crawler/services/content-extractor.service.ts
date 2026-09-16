import { Readability } from "@mozilla/readability";
import { Injectable } from "@nestjs/common";
import { parseHTML } from "linkedom";
import type { ExtractedPage, ExtractedSection } from "../crawler.types.js";

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

    const parsed = new Readability(document).parse();
    if (!parsed?.content) return { article: null, links };

    return {
      article: {
        title: normalize(parsed.title ?? ""),
        sections: toSections(parsed.content),
      },
      links,
    };
  }
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
