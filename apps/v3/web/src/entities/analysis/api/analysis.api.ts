import { apiClient } from "@/shared/api";
import type { AnalysisRun, AnalysisSummary } from "../model/analysis";

export function getAnalyses(): Promise<AnalysisSummary[]> {
  return apiClient<AnalysisSummary[]>("/analyses");
}

export function getAnalysis(id: string): Promise<AnalysisRun> {
  return apiClient<AnalysisRun>(`/analyses/${id}`);
}
