import { SquarePen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { useStartAnalysis } from "../model/useStartAnalysis";
import { AnalysisForm } from "./AnalysisForm";

export function NewAnalysisDialog() {
  const [open, setOpen] = useState(false);
  const { start, isStarting, error } = useStartAnalysis({
    onStarted: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <SquarePen className="size-4" />
          Новый анализ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Параметры анализа</DialogTitle>
          <DialogDescription>
            Задайте тему, два домена и глубину обхода. Каждый домен обходится от
            корня; пустые и технические страницы пропускаются.
          </DialogDescription>
        </DialogHeader>
        <AnalysisForm onSubmit={start} isStarting={isStarting} error={error} />
      </DialogContent>
    </Dialog>
  );
}
