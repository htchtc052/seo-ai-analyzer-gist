import { CircleQuestionMark, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { useMemo, type ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import type { CompletedAnalysis } from "@/entities/analysis";
import { buildAnalysisReport } from "../model/analysis-report";
import { OpportunitiesTable } from "./OpportunitiesTable";
import { formatPercent, formatScore, formatSum } from "./report-format";

export function AnalysisReport({ run }: { run: CompletedAnalysis }) {
  const report = useMemo(() => buildAnalysisReport(run), [run]);

  return (
    <TooltipProvider>
      <div className="grid gap-6">
        <section className="grid grid-cols-4 gap-3">
          <SummaryMetric
            label="Суммарная оценка"
            value={formatSum(report.summary.score)}
            description="Сумма оценок всех страниц конкурента"
            help="Сумма оценок страниц конкурента. Оценка страницы берётся по пяти её лучшим фрагментам, а не по всем: иначе длинная статья не по теме обгоняла короткую по теме за счёт одного объёма."
          />
          <SummaryMetric
            label="Уже есть у нас"
            value={formatPercent(report.summary.coverage)}
            description="Средняя похожесть материалов конкурента на ваши"
            help="Для каждого фрагмента конкурента берётся наибольшая косинусная близость к фрагментам вашего домена. Среднее взвешено по релевантности запросу: далёкие от темы фрагменты почти не влияют."
          />
          <SummaryMetric
            label="Релевантность конкурента"
            value={formatScore(report.summary.meanRelevance)}
            description="Насколько его домен вообще о вашем запросе"
            help="Средняя косинусная близость эмбеддингов фрагментов конкурента к эмбеддингу запроса. Низкое значение означает, что на обойдённых страницах темы почти нет."
          />
          <SummaryMetric
            label="Релевантность вашего сайта"
            value={formatScore(report.summary.meanPrimaryRelevance)}
            description="Насколько ваши обойдённые страницы о запросе"
            help="То же самое для фрагментов вашего домена. Если обе релевантности низкие, обход не дошёл до нужных страниц ни у вас, ни у конкурента, и сравнивать нечего."
          />
        </section>

        {isOffTopic(report.summary) && (
          <Alert variant="destructive">
            <AlertTitle>Обход не нашёл материалов по запросу</AlertTitle>
            <AlertDescription>
              Средняя релевантность {formatScore(report.summary.meanRelevance)}{" "}
              у конкурента и {formatScore(report.summary.meanPrimaryRelevance)}{" "}
              у вас. Это уровень несвязанного текста: таблица ниже ранжирует
              страницы между собой, но ни одна из них не о запросе. Сузьте
              запрос или увеличьте лимит страниц.
            </AlertDescription>
          </Alert>
        )}

        <Method model={run.semantic.model} />

        <OpportunitiesTable pages={report.pages} />
      </div>
    </TooltipProvider>
  );
}

const OFF_TOPIC_RELEVANCE = 0.25;

function isOffTopic(summary: {
  meanRelevance: number;
  meanPrimaryRelevance: number;
}): boolean {
  return (
    summary.meanRelevance < OFF_TOPIC_RELEVANCE &&
    summary.meanPrimaryRelevance < OFF_TOPIC_RELEVANCE
  );
}

const methodLines: Array<[string, string]> = [
  ["релевантность", "cos(эмбеддинг запроса, эмбеддинг фрагмента)"],
  ["сходство", "max cos(фрагмент конкурента, каждый фрагмент вашего домена)"],
  ["оценка фрагмента", "релевантность × (1 − сходство)"],
  ["оценка страницы", "сумма оценок пяти лучших её фрагментов"],
  ["покрытие", "Σ(релевантность × сходство) ÷ Σ(релевантность)"],
];

function Method({ model }: { model: string }) {
  return (
    <details className="rounded-lg border bg-muted/20 p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <CircleQuestionMark className="size-4 text-muted-foreground" />
        Как считается
      </summary>
      <div className="mt-4 grid gap-2">
        {methodLines.map(([term, formula]) => (
          <div
            key={term}
            className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:gap-4"
          >
            <span className="text-xs text-muted-foreground">{term}</span>
            <code className="text-xs leading-5">{formula}</code>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Модель эмбеддингов — {model}. Векторы нормализованы, поэтому косинус
        равен скалярному произведению. Порогов и отсечек нет: каждый фрагмент
        входит в сумму со своим весом, а не относится к категории.
      </p>
    </details>
  );
}

function SummaryMetric({
  label,
  value,
  description,
  help,
}: {
  label: string;
  value: string;
  description: string;
  help: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <InfoTip>{help}</InfoTip>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function InfoTip({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Пояснение"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}
