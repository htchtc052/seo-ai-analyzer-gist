import { apiClient } from "@/shared/api";
import {
  analysisReceiptSchema,
  type AnalysisInput,
  type AnalysisReceipt,
} from "@/entities/analysis";

export async function startAnalysis(
  input: AnalysisInput,
): Promise<AnalysisReceipt> {
  const response = await apiClient("/analyses", {
    method: "POST",
    body: input,
  });
  return analysisReceiptSchema.parse(response);
}
