import { ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import type { CompletedAnalysis, ReportPage } from "@/entities/analysis";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { ColumnHelp } from "./ColumnHelp";
import { formatPercent, formatScore } from "./report-format";

export function AnalysisReport({ run }: { run: CompletedAnalysis }) {
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
                    formula="среднее cos(запрос, фрагмент) по фрагментам страницы"
                    note="Насколько страница вообще про запрос. Величина абсолютная: её диапазоны задаёт модель, поэтому она сравнима между запусками. Около 0.25 — уровень текста, не связанного с запросом."
                  />
                </TableHead>
                <TableHead className="text-right">
                  <ColumnHelp
                    label="Новизна"
                    reference="страницы относительно нашей"
                    formula="Σ(релевантность × (1 − похожесть)) ÷ Σ релевантность"
                    note="Какая доля релевантного содержания страницы не похожа на нашу. Похожесть фрагмента — наибольший cos до фрагментов нашей страницы, поэтому величина относительна: она зависит от того, что написано именно у нас. У нашей страницы новизны нет — сравнивать её с самой собой нечем."
                  />
                </TableHead>
                <TableHead className="text-right">
                  <ColumnHelp
                    label="Приоритет"
                    reference="страницы как нового покрытия"
                    formula="релевантность × новизна"
                    note="Насколько стоит позаимствовать с этой страницы: высок, только когда она одновременно про запрос и не похожа на то, что у нас уже есть. Относительность наследует от новизны."
                  />
                </TableHead>
                <TableHead className="text-right">
                  <ColumnHelp
                    label="Фрагментов"
                    formula="число абзацев, попавших в разбор"
                    note="Сколько абзацев извлеклось из статьи. Влияет на устойчивость остальных чисел: по трём абзацам средние шумят."
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.pages.map((page) => (
                <Row key={page.url} page={page} />
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </TooltipProvider>
  );
}

function Row({ page }: { page: ReportPage }) {
  return (
    <TableRow className={page.ours ? "bg-muted/40" : undefined}>
      <TableCell>
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
          <span className="truncate text-xs text-muted-foreground">
            {page.url}
          </span>
        </a>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatScore(page.relevance)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {page.novelty === null ? <Dash /> : formatPercent(page.novelty)}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {page.priority === null ? <Dash /> : formatScore(page.priority)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {page.fragmentCount}
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
