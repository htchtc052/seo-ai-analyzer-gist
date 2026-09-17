import { apiClient } from "@/shared/api";
import type { AnalysisInput, AnalysisReceipt } from "@/entities/analysis";

export function startAnalysis(input: AnalysisInput): Promise<AnalysisReceipt> {
  return apiClient<AnalysisReceipt>("/analyses", {
    method: "POST",
    body: input,
  });
}
