import { apiClient } from "@/shared/api";

export function deleteAnalysis(id: string): Promise<void> {
  return apiClient(`/analyses/${encodeURIComponent(id)}`, { method: "DELETE" });
}
