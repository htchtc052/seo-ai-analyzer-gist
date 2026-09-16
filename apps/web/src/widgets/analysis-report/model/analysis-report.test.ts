import assert from "node:assert/strict";
import { test } from "node:test";
import { buildAnalysisReport } from "./analysis-report";
import type { CompletedAnalysis } from "@/entities/analysis";

function page(url: string, paragraphs: string[]) {
  return { url, title: url, sections: [{ heading: null, paragraphs }] };
}

function run(competitorParagraphs: string[][]): CompletedAnalysis {
  const pages = competitorParagraphs.map((paragraphs, index) =>
    page(`https://rival.test/${index}`, paragraphs),
  );
  return {
    id: "00000000-0000-4000-8000-000000000000",
    searchQuery: "query",
    primarySiteUrl: "https://ours.test/",
    competitorSiteUrl: "https://rival.test/",
    maxPagesPerSite: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "completed",
    sources: {
      primary: {
        startUrl: "https://ours.test/",
        pages: [page("https://ours.test/0", ["ours"])],
      },
      competitor: { startUrl: "https://rival.test/", pages },
    },
    semantic: {
      model: "test",
      primary: [
        {
          ref: { pageIndex: 0, sectionIndex: 0, paragraphIndex: 0 },
          relevance: 0.5,
        },
      ],
      competitor: competitorParagraphs.flatMap((paragraphs, pageIndex) =>
        paragraphs.map((_, paragraphIndex) => ({
          ref: { pageIndex, sectionIndex: 0, paragraphIndex },
          relevance: paragraphIndex === 0 ? 0.9 : 0.1,
          maxPrimarySimilarity: 0,
          closestPrimaryRef: {
            pageIndex: 0,
            sectionIndex: 0,
            paragraphIndex: 0,
          },
        })),
      ),
    },
  } as CompletedAnalysis;
}

function scoreOf(report: ReturnType<typeof buildAnalysisReport>): number {
  const score = report.pages[0]!.score;
  assert(score !== undefined);
  return score;
}

test("weak fragments never raise a page score", () => {
  const short = buildAnalysisReport(run([["one strong", "weak"]]));
  const long = buildAnalysisReport(
    run([["one strong", ...Array.from({ length: 40 }, () => "weak")]]),
  );
  assert(scoreOf(long) <= scoreOf(short));
});

test("a short page about the query outranks a long page around it", () => {
  const report = buildAnalysisReport(
    run([Array.from({ length: 40 }, () => "weak"), ["one strong", "weak"]]),
  );
  assert.equal(report.pages[0]!.url, "https://rival.test/1");
});
