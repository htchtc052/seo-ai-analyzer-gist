import { apiClient } from "@/shared/api";
import type { AnalysisRun, AnalysisRunSummary } from "../model/analysis-run";

export async function getAnalysisRun(id: string): Promise<AnalysisRun> {
  const { run } = await apiClient<{ run: AnalysisRun }>(
    `/analyses/${encodeURIComponent(id)}`,
  );
  return run;
}

export async function getAnalysisRuns(): Promise<AnalysisRunSummary[]> {
  const { runs } = await apiClient<{ runs: AnalysisRunSummary[] }>("/analyses");
  return runs;
}
