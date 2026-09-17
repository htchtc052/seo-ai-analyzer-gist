import type { Analysis } from "@prisma/client";
import type { AnalysisRun, AnalysisSummary } from "../dto/analysis.types.js";

// Граница Prisma: наружу не уходят ни типы ORM, ни имена её перечислений.
export function toAnalysisSummary(run: Analysis): AnalysisSummary {
  return {
    id: run.id,
    searchQuery: run.searchQuery,
    status: run.status.toLowerCase() as AnalysisSummary["status"],
    competitorCount: run.competitorUrls.length,
    createdAt: run.createdAt.toISOString(),
  };
}

export function toAnalysisRun(run: Analysis): AnalysisRun {
  return {
    ...toAnalysisSummary(run),
    primaryUrl: run.primaryUrl,
    competitorUrls: run.competitorUrls,
  };
}
