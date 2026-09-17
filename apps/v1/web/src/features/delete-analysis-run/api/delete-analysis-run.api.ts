import { apiClient } from "@/shared/api";

export function deleteAnalysisRun(id: string): Promise<void> {
  return apiClient(`/analyses/${encodeURIComponent(id)}`, { method: "DELETE" });
}
