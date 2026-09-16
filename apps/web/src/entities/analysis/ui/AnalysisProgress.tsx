import {
  Check,
  Circle,
  CircleX,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import type { AnalysisRun } from "../model/analysis";

type AnalysisProgressProps = {
  run: AnalysisRun;
};

const steps = [
  { label: "В очереди", description: "Задача принята" },
  { label: "Обход сайтов", description: "Собираем страницы" },
  { label: "Семантический анализ", description: "Считаем близость" },
  { label: "Отчёт готов", description: "Показываем результаты" },
] as const;

export function AnalysisProgress({ run }: AnalysisProgressProps) {
  const activeIndex = getActiveIndex(run);
  const failedIndex = run.status === "failed" ? activeIndex : -1;

  return (
    <section
      aria-label="Ход анализа"
      className="rounded-xl border bg-card px-5 py-5 shadow-sm"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-semibold">Ход анализа</h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {getCurrentLabel(run)}
        </span>
      </div>
      <ol className="grid grid-cols-4 gap-4">
        {steps.map((step, index) => {
          const state =
            index === failedIndex
              ? "failed"
              : index < activeIndex || run.status === "completed"
                ? "completed"
                : index === activeIndex
                  ? "active"
                  : "pending";
          const Icon = getStepIcon(state);

          return (
            <li
              key={step.label}
              aria-current={state === "active" ? "step" : undefined}
              className="block"
            >
              <div className="mb-3 flex items-center">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border",
                    state === "completed" &&
                      "border-primary bg-primary text-primary-foreground",
                    state === "active" &&
                      "border-primary bg-primary/10 text-primary",
                    state === "failed" &&
                      "border-destructive bg-destructive/10 text-destructive",
                    state === "pending" &&
                      "border-border text-muted-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      state === "active" && "animate-spin",
                    )}
                  />
                </span>
                {index < steps.length - 1 && (
                  <span
                    className={cn(
                      "mx-2 h-px flex-1",
                      index < activeIndex ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
              <div>
                <div className="text-sm font-medium">{step.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

type StepState = "completed" | "active" | "pending" | "failed";

function getStepIcon(state: StepState): LucideIcon {
  if (state === "completed") return Check;
  if (state === "active") return LoaderCircle;
  if (state === "failed") return CircleX;
  return Circle;
}

function getActiveIndex(run: AnalysisRun): number {
  if (run.status === "queued") return 0;
  if (run.status === "crawling") return 1;
  if (run.status === "crawled" || run.status === "analyzing") return 2;
  if (run.status === "completed") return 3;
  return run.sources ? 2 : 1;
}

function getCurrentLabel(run: AnalysisRun): string {
  if (run.status === "queued") return "Ожидает запуска";
  if (run.status === "crawling") return `Собрано страниц: ${run.progress.done}`;
  if (run.status === "crawled" || run.status === "analyzing")
    return `Обработано страниц: ${run.progress.done} из ${run.progress.total}`;
  if (run.status === "completed") return "Завершён";
  return "Остановлен с ошибкой";
}
