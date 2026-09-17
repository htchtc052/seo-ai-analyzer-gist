import { useQuery } from "@tanstack/react-query";
import { getAnalyses } from "../api/analysis.api";
import { analysisKeys } from "./query-keys";

const pendingStatuses = ["queued", "crawling", "crawled", "analyzing"];

export function useAnalyses() {
  const query = useQuery({
    queryKey: analysisKeys.all,
    queryFn: getAnalyses,
    refetchInterval: ({ state }) =>
      state.data?.some((analysis) => pendingStatuses.includes(analysis.status))
        ? 2_000
        : false,
  });

  return { analyses: query.data ?? [] };
}
