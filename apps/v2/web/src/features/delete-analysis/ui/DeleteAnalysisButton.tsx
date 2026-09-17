import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { analysisKeys } from "@/entities/analysis";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { deleteAnalysis } from "../api/delete-analysis.api";

type DeleteAnalysisButtonProps = {
  id: string;
  searchQuery: string;
};

export function DeleteAnalysisButton({
  id,
  searchQuery,
}: DeleteAnalysisButtonProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteAnalysis(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: analysisKeys.all }),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Удалить отчёт"
          disabled={mutation.isPending}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Удалить отчёт?</AlertDialogTitle>
        <AlertDialogDescription>
          Отчёт по запросу «{searchQuery}» будет удалён вместе с собранными
          страницами, фрагментами и их эмбеддингами. Действие необратимо.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={() => mutation.mutate()}>
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
