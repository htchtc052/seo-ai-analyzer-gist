import { apiClient } from "@/shared/api";
import {
  analysisListSchema,
  analysisRunSchema,
  type AnalysisRun,
  type AnalysisSummary,
} from "../model/analysis";

export async function getAnalysis(id: string): Promise<AnalysisRun> {
  return analysisRunSchema.parse(await apiClient(`/analyses/${id}`));
}

export async function getAnalyses(): Promise<AnalysisSummary[]> {
  return analysisListSchema.parse(await apiClient("/analyses"));
}
