import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analysisKeys, type AnalysisInput } from "@/entities/analysis";
import { toApiErrorMessage } from "@/shared/api";
import { startAnalysis } from "../api/start-analysis.api";

export function useStartAnalysis() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: startAnalysis,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: analysisKeys.all });
    },
  });

  return {
    start: (input: AnalysisInput) => mutation.mutate(input),
    isStarting: mutation.isPending,
    error: mutation.error ? toApiErrorMessage(mutation.error) : null,
  };
}
