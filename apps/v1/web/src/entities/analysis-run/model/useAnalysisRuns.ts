import { useQuery } from "@tanstack/react-query";
import { getAnalysisRuns } from "../api/analysis-run.api";
import { analysisRunKeys } from "./query-keys";
import { getRecommendationStatus } from "./recommendation-status";

const POLL_INTERVAL_MS = 2000;

export function useAnalysisRuns() {
  return useQuery({
    queryKey: analysisRunKeys.all,
    queryFn: getAnalysisRuns,
    select: (runs) =>
      runs.map((run) => ({
        run,
        status: getRecommendationStatus(run.competitorCount, run),
      })),
    refetchIntervalInBackground: true,
    refetchInterval: (query) =>
      query.state.data?.some(
        (run) =>
          getRecommendationStatus(run.competitorCount, run) === "pending",
      )
        ? POLL_INTERVAL_MS
        : false,
  });
}
