import { ChevronRight, FileSearch } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { AnalysisSummary } from "../model/analysis";

const statusLabels: Record<AnalysisSummary["status"], string> = {
  queued: "В очереди",
  crawling: "Обход сайтов",
  crawled: "Страницы собраны",
  analyzing: "Семантический анализ",
  completed: "Готов",
  failed: "Ошибка",
};

type AnalysisListProps = {
  analyses: AnalysisSummary[];
  action?: (analysis: AnalysisSummary) => ReactNode;
};

export function AnalysisList({ analyses, action }: AnalysisListProps) {
  if (analyses.length === 0)
    return (
      <p className="rounded-lg border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
        Пока нет ни одного анализа. Начните с кнопки «Новый анализ».
      </p>
    );

  return (
    <ul className="divide-y overflow-hidden rounded-lg border bg-background">
      {analyses.map((analysis) => (
        <li
          key={analysis.id}
          className="flex items-center gap-2 pr-2 transition-colors hover:bg-accent"
        >
          <Link
            to={`/analyses/${analysis.id}`}
            className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3"
          >
            <FileSearch className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {analysis.searchQuery}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {analysis.pageCount} стр. · {formatDate(analysis.createdAt)}
              </span>
            </span>
            <span
              className={
                analysis.status === "failed"
                  ? "shrink-0 text-xs text-destructive"
                  : "shrink-0 text-xs text-muted-foreground"
              }
            >
              {statusLabels[analysis.status]}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
          {action?.(analysis)}
        </li>
      ))}
    </ul>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
