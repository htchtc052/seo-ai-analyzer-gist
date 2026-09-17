import { ChevronRight } from "lucide-react";
import type { ReportPage } from "@/entities/analysis";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { formatScore } from "./report-format";

type Props = {
  page: Extract<ReportPage, { status: "scored" }>;
  totalFragments: number;
  selectedTotal: number;
};

export function RecommendationDialog({
  page,
  totalFragments,
  selectedTotal,
}: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="tabular-nums">
          {page.recommendations.length} {toWord(page.recommendations.length)}
          <ChevronRight />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogTitle>Что взять со страницы</DialogTitle>
        <DialogDescription className="grid gap-2 text-left">
          <span>{page.title}</span>
          <span>
            Эти {page.recommendations.length}{" "}
            {toWord(page.recommendations.length)} выбраны из {totalFragments}{" "}
            абзацев всех конкурентов сразу. GIST берёт {selectedTotal}, которые
            ценны и при этом не повторяют друг друга.
          </span>
          <span>
            Ценность абзаца — его релевантность, умноженная на новизну. Это
            число мы и передаём в GIST, а приоритет страницы{" "}
            {formatScore(page.priority ?? 0)} — среднее таких чисел по всем её
            абзацам.
          </span>
        </DialogDescription>

        <ol className="grid gap-4">
          {page.recommendations.map((item, index) => (
            <li key={index} className="grid gap-1 border-l-2 pl-4">
              <span className="text-xs text-muted-foreground">
                {item.heading ?? "без заголовка"}
              </span>
              <p className="text-sm leading-6">{item.text}</p>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

function toWord(count: number): string {
  const last = count % 10;
  const tens = count % 100;
  if (tens >= 11 && tens <= 14) return "абзацев";
  if (last === 1) return "абзац";
  if (last >= 2 && last <= 4) return "абзаца";
  return "абзацев";
}
