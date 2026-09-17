import { useQuery } from "@tanstack/react-query";
import { getAnalysisRun } from "../api/analysis-run.api";
import { analysisRunKeys } from "./query-keys";
import { getRecommendationStatus } from "./recommendation-status";

const POLL_INTERVAL_MS = 2000;

export function useAnalysisRun(id: string) {
  return useQuery({
    queryKey: analysisRunKeys.detail(id),
    queryFn: () => getAnalysisRun(id),
    select: (run) => ({
      run,
      status: getRecommendationStatus(run.competitors.length, run),
    }),
    refetchIntervalInBackground: true,
    refetchInterval: (query) => {
      const run = query.state.data;
      return run &&
        getRecommendationStatus(run.competitors.length, run) === "pending"
        ? POLL_INTERVAL_MS
        : false;
    },
  });
}
