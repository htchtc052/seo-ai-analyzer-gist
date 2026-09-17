import { useQuery } from "@tanstack/react-query";
import { getAnalyses } from "../api/analysis.api";
import { analysisKeys } from "./query-keys";

export function useAnalyses() {
  return useQuery({ queryKey: analysisKeys.all, queryFn: getAnalyses });
}
