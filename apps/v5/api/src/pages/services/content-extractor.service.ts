import { Readability } from "@mozilla/readability";
import { Injectable } from "@nestjs/common";
import { parseHTML } from "linkedom";
import type { ExtractedPage, ExtractedSection } from "../pages.types.js";

const TEXT_BLOCKS = "h2, h3, p, li, blockquote, div";
const CHROME_BLOCKS = "script, style, nav, header, footer, aside, form";
const MIN_PARAGRAPH_LENGTH = 150;
const MAX_PARAGRAPH_LENGTH = 800;
const MIN_ARTICLE_SHARE_OF_DOCUMENT = 0.5;

@Injectable()
export class ContentExtractorService {
  extract(html: string): ExtractedPage {
    const { document } = parseHTML(html);
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
        sections,
      },
    };
  }
}

function toSections(html: string): ExtractedSection[] {
  const { document } = parseHTML(
    `<!doctype html><html><body>${html}</body></html>`,
  );
  const sections: ExtractedSection[] = [];
  const seen = new Set<string>();
  let current: ExtractedSection | undefined;

  for (const node of document.querySelectorAll("pre")) node.remove();

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
    for (const paragraph of toParagraphs(text)) {
      if (seen.has(paragraph)) continue;
      seen.add(paragraph);
      current.paragraphs.push(paragraph);
    }
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

  const sentences = text.split(/(?<=[.!?\u2026])\s+/).flatMap(toWordChunks);

  const parts: string[] = [];
  let current = "";
  for (const sentence of sentences) {
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

function toWordChunks(sentence: string): string[] {
  if (sentence.length <= MAX_PARAGRAPH_LENGTH) return [sentence];

  const chunks: string[] = [];
  let current = "";
  for (const word of sentence.split(/\s+/)) {
    if (current && current.length + word.length >= MAX_PARAGRAPH_LENGTH) {
      chunks.push(current);
      current = word;
      continue;
    }
    current = current ? `${current} ${word}` : word;
  }
  if (current) chunks.push(current);
  return chunks;
}
