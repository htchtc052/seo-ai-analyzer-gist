import { AnalysisStatus, PageSource, Prisma } from "@prisma/client";
import type {
  AnalysisFailure,
  AnalysisRun,
  AnalysisSummary,
  Recommendation,
  ReportPage,
} from "../dto/analysis.types.js";

export const runInclude = Prisma.validator<Prisma.AnalysisInclude>()({
  pages: {
    orderBy: [{ source: "asc" }, { position: "asc" }],
    select: {
      source: true,
      url: true,
      title: true,
      embeddedAt: true,
      failureReason: true,
      failureDetail: true,
      fragments: {
        select: {
          relevance: true,
          similarity: true,
          selectedRank: true,
          heading: true,
          text: true,
        },
      },
    },
  },
});

export const recommendationSelect = Prisma.validator<Prisma.FragmentSelect>()({
  heading: true,
  text: true,
  relevance: true,
  similarity: true,
  selectedRank: true,
  page: { select: { url: true, title: true } },
});

export const summarySelect = Prisma.validator<Prisma.AnalysisSelect>()({
  id: true,
  searchQuery: true,
  status: true,
  createdAt: true,
  _count: { select: { pages: true } },
});

type RunRecord = Prisma.AnalysisGetPayload<{ include: typeof runInclude }>;
type RunPage = RunRecord["pages"][number];
type SummaryRecord = Prisma.AnalysisGetPayload<{
  select: typeof summarySelect;
}>;

export function toAnalysisSummary(run: SummaryRecord): AnalysisSummary {
  return {
    id: run.id,
    searchQuery: run.searchQuery,
    status: run.status.toLowerCase() as AnalysisSummary["status"],
    competitorCount: run._count.pages - 1,
    createdAt: run.createdAt.toISOString(),
  };
}

export function toAnalysisRun(run: RunRecord): AnalysisRun {
  const base = {
    id: run.id,
    searchQuery: run.searchQuery,
    primaryUrl: run.pages.find((page) => page.source === PageSource.PRIMARY)!
      .url,
    competitorUrls: run.pages
      .filter((page) => page.source === PageSource.COMPETITOR)
      .map((page) => page.url),
    createdAt: run.createdAt.toISOString(),
  };

  if (run.status === AnalysisStatus.QUEUED)
    return { ...base, status: "queued" };

  if (run.status === AnalysisStatus.FAILED)
    return { ...base, status: "failed", error: toFailure(run) };

  if (run.status === AnalysisStatus.RUNNING)
    return {
      ...base,
      status: "running",
      progress: {
        done: run.pages.filter((page) => page.embeddedAt ?? page.failureReason)
          .length,
        total: run.pages.length,
      },
    };

  return {
    ...base,
    status: "completed",
    model: run.embeddingModel!,
    pages: toReportPages(run.pages),
    selection: {
      objective: run.selectionObjective!,
      utility: run.selectionUtility!,
      diversity: run.selectionDiversity!,
    },
  };
}

function toReportPages(pages: RunPage[]): ReportPage[] {
  const rows = pages.map(toReportPage);
  const scored = rows.filter((row) => row.status === "scored");
  return [
    ...scored.filter((row) => row.ours),
    ...scored
      .filter((row) => !row.ours)
      .toSorted((left, right) => (right.priority ?? 0) - (left.priority ?? 0)),
    ...rows.filter((row) => row.status === "failed"),
  ];
}

function toReportPage(page: RunPage): ReportPage {
  const ours = page.source === PageSource.PRIMARY;
  if (page.failureReason)
    return {
      url: page.url,
      ours,
      status: "failed",
      reason: page.failureReason.toLowerCase() as "unreachable" | "empty",
      detail: page.failureDetail!,
    };

  const scores = page.fragments.map((fragment) => ({
    relevance: clamp(fragment.relevance ?? 0),
    similarity: clamp(fragment.similarity ?? 0),
  }));
  const weight = total(scores.map((score) => score.relevance));
  const novelty =
    ours || weight === 0
      ? null
      : total(scores.map((s) => s.relevance * (1 - s.similarity))) / weight;
  const relevance = weight / scores.length;

  return {
    url: page.url,
    ours,
    status: "scored",
    title: page.title!,
    fragmentCount: scores.length,
    relevance,
    novelty,
    priority: novelty === null ? null : relevance * novelty,
    recommendations: toRecommendations(page.fragments),
  };
}

function toRecommendations(fragments: RunPage["fragments"]): Recommendation[] {
  return fragments
    .filter((fragment) => fragment.selectedRank !== null)
    .toSorted((left, right) => left.selectedRank! - right.selectedRank!)
    .map((fragment) => ({
      heading: fragment.heading,
      text: fragment.text,
      gap:
        clamp(fragment.relevance ?? 0) * (1 - clamp(fragment.similarity ?? 0)),
    }));
}

function toFailure(run: RunRecord): AnalysisFailure {
  return {
    reason: (
      run.failureReason ?? "INTERNAL"
    ).toLowerCase() as AnalysisFailure["reason"],
    url: run.failureUrl,
    detail: run.failureDetail,
  };
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function total(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}
