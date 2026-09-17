import { skipToken, useQuery } from "@tanstack/react-query";
import { toApiErrorMessage } from "@/shared/api";
import { getAnalysis } from "../api/analysis.api";
import { analysisKeys } from "./query-keys";

export function useAnalysis(id: string | undefined) {
  const query = useQuery({
    queryKey: analysisKeys.detail(id ?? ""),
    queryFn: id ? () => getAnalysis(id) : skipToken,
    retry: false,
    refetchInterval: ({ state }) => {
      const status = state.data?.status;
      return status === "completed" || status === "failed" ? false : 1_000;
    },
  });

  return {
    run: query.data,
    isLoading: query.isPending,
    error: query.error ? toApiErrorMessage(query.error) : null,
  };
}
