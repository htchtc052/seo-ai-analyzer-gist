import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { analysisKeys, type AnalysisInput } from "@/entities/analysis";
import { toApiErrorMessage } from "@/shared/api";
import { startAnalysis } from "../api/start-analysis.api";

export function useStartAnalysis({ onStarted }: { onStarted: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: startAnalysis,
    onSuccess: async (receipt) => {
      onStarted();
      await queryClient.invalidateQueries({ queryKey: analysisKeys.all });
      await navigate(`/analyses/${receipt.id}`);
    },
  });

  return {
    start: (input: AnalysisInput) => mutation.mutate(input),
    isStarting: mutation.isPending,
    error: mutation.error ? toApiErrorMessage(mutation.error) : null,
  };
}
