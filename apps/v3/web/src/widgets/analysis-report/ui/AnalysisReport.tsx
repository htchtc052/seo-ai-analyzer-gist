import { ExternalLink, Info } from "lucide-react";
import type { CompletedAnalysis, ReportPage } from "@/entities/analysis";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { ColumnHelp } from "./ColumnHelp";
import { RecommendationDialog } from "./RecommendationDialog";
import { formatPercent, formatScore } from "./report-format";

export function AnalysisReport({ run }: { run: CompletedAnalysis }) {
  const totalFragments = run.pages.reduce(
    (total, page) =>
      page.status === "scored" && !page.ours
        ? total + page.fragmentCount
        : total,
    0,
  );
  const selectedTotal = run.pages.reduce(
    (total, page) =>
      page.status === "scored" ? total + page.recommendations.length : total,
    0,
  );

  return (
    <TooltipProvider>
      <section className="grid gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-semibold">Страницы</h2>
          <span className="text-xs text-muted-foreground">
            модель {run.model}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Страница</TableHead>
                <TableHead className="text-right">
                  <ColumnHelp
                    label="Релевантность"
                    reference="страницы запросу"
                    formula="среднее cos(запрос, абзац) по абзацам страницы"
                    note="Насколько страница вообще про запрос. Величина абсолютная: её диапазоны задаёт модель, поэтому она сравнима между запусками. Около 0.25 — уровень текста, не связанного с запросом."
                  />
                </TableHead>
                <TableHead className="text-right">
                  <ColumnHelp
                    label="Новизна"
                    reference="страницы относительно нашей"
                    formula="Σ(релевантность × новизна абзаца) ÷ Σ релевантность"
                    note="Какая доля релевантного содержания страницы не похожа на нашу. Новизна абзаца — это 1 минус наибольший cos до абзацев нашей страницы, поэтому величина относительна и зависит от того, что написано именно у нас. Короткий абзац почти всегда выглядит новее длинного: совпасть ему не с чем."
                  />
                </TableHead>
                <TableHead className="text-right">
                  <ColumnHelp
                    label="Рекомендации"
                    formula="сколько абзацев этой страницы выбрал GIST"
                    note="Отбор идёт сразу по всем абзацам конкурентов, а не по страницам. Подробности — внутри, по кнопке."
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.pages.map((page) => (
                <Row
                  key={page.url}
                  page={page}
                  totalFragments={totalFragments}
                  selectedTotal={selectedTotal}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </TooltipProvider>
  );
}

function Row({
  page,
  totalFragments,
  selectedTotal,
}: {
  page: ReportPage;
  totalFragments: number;
  selectedTotal: number;
}) {
  if (page.status === "failed") return <FailedRow page={page} />;

  return (
    <TableRow className={page.ours ? "bg-muted/40" : undefined}>
      <TableCell>
        <PageLink page={page} />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatScore(page.relevance)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {page.novelty === null ? <Dash /> : formatPercent(page.novelty)}
      </TableCell>
      <TableCell className="text-right">
        {page.recommendations.length > 0 ? (
          <RecommendationDialog
            page={page}
            totalFragments={totalFragments}
            selectedTotal={selectedTotal}
          />
        ) : page.priority === null ? (
          <Dash />
        ) : (
          <SkippedHelp priority={page.priority} selectedTotal={selectedTotal} />
        )}
      </TableCell>
    </TableRow>
  );
}

function SkippedHelp({
  priority,
  selectedTotal,
}: {
  priority: number;
  selectedTotal: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="text-xs tabular-nums">
        приоритет {formatScore(priority)}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Почему нет рекомендаций"
            className="text-muted-foreground hover:text-foreground"
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <span className="block font-semibold">Почему ничего не выбрано</span>
          <code className="mt-1.5 block text-[0.6875rem] leading-5">
            приоритет = релевантность × новизна
          </code>
          <span className="mt-2 block">
            Приоритет посчитан, он про страницу целиком. А отбор идёт по
            абзацам: GIST берёт {selectedTotal} штук сразу со всех конкурентов и
            отбрасывает те, что повторяют уже взятое. Значит сильные абзацы этой
            страницы говорят о том же, что нашлось у другой.
          </span>
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

function PageLink({
  page,
}: {
  page: Extract<ReportPage, { status: "scored" }>;
}) {
  return (
    <a
      href={page.url}
      target="_blank"
      rel="noreferrer"
      className="group grid max-w-xl gap-1 whitespace-normal"
    >
      <span className="text-xs text-muted-foreground">
        {page.ours ? "наша страница" : "конкурент"}
      </span>
      <span className="flex items-start gap-2 leading-5 font-medium group-hover:text-primary">
        {page.title}
        <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      </span>
      <span className="truncate text-xs text-muted-foreground">{page.url}</span>
    </a>
  );
}

function FailedRow({
  page,
}: {
  page: Extract<ReportPage, { status: "failed" }>;
}) {
  return (
    <TableRow className="text-muted-foreground">
      <TableCell>
        <a
          href={page.url}
          target="_blank"
          rel="noreferrer"
          className="group grid max-w-xl gap-1 whitespace-normal"
        >
          <span className="text-xs">
            {page.ours ? "наша страница" : "конкурент"} · не прочитана
          </span>
          <span className="flex items-start gap-2 truncate text-xs group-hover:text-primary">
            {page.url}
            <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
          </span>
        </a>
      </TableCell>
      <TableCell colSpan={3} className="text-sm">
        {page.reason === "empty"
          ? "Читаемого текста статьи не нашлось"
          : "Страница не открылась"}
        <span className="block text-xs">{page.detail}</span>
      </TableCell>
    </TableRow>
  );
}

function Dash() {
  return (
    <span className="text-muted-foreground" title="нечем сравнивать">
      —
    </span>
  );
}
