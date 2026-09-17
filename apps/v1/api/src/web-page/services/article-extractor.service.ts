import { Readability } from "@mozilla/readability";
import { Injectable } from "@nestjs/common";
import { parseHTML } from "linkedom";

const TEXT_BLOCKS = "h2, h3, p, li, blockquote, pre, div";
const MIN_PARAGRAPH_LENGTH = 40;

type ExtractedSection = { heading: string | null; paragraphs: string[] };

export type ExtractedArticle = { title: string; sections: ExtractedSection[] };

@Injectable()
export class ArticleExtractorService {
  extract(html: string): ExtractedArticle | null {
    const { document } = parseHTML(html);
    if (!document.documentElement) return null;
    const parsed = new Readability(document).parse();
    if (!parsed?.content) return null;
    return {
      title: normalize(parsed.title ?? ""),
      sections: toSections(parsed.content),
    };
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
