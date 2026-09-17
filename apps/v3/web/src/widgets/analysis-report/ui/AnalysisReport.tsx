import { ExternalLink } from "lucide-react";
import { useState } from "react";
import type { CompletedAnalysis, ReportPage } from "@/entities/analysis";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { ColumnHelp } from "./ColumnHelp";
import { FragmentDialog, type DialogSubject } from "./FragmentDialog";
import { SelectedFragments } from "./SelectedFragments";
import { formatPercent, formatScore } from "./report-format";

export function AnalysisReport({ run }: { run: CompletedAnalysis }) {
  const [subject, setSubject] = useState<DialogSubject | null>(null);
  const poolSize = run.pages.reduce(
    (total, page) =>
      page.status === "scored" && !page.ours
        ? total + page.fragmentCount
        : total,
    0,
  );

  return (
    <TooltipProvider>
      <div className="grid gap-8">
        <SelectedFragments run={run} poolSize={poolSize} onOpen={setSubject} />

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
                      label="Вклад"
                      formula="сколько абзацев этой страницы попало в отбор"
                      note="Отбор идёт сразу по абзацам всех конкурентов и отбрасывает те, что повторяют уже взятое. Поэтому прочерк не значит, что страница плохая: её сильные абзацы говорят о том же, что нашлось у другой."
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {run.pages.map((page) => (
                  <Row key={page.url} page={page} onOpen={setSubject} />
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <FragmentDialog subject={subject} onClose={() => setSubject(null)} />
      </div>
    </TooltipProvider>
  );
}

function Row({
  page,
  onOpen,
}: {
  page: ReportPage;
  onOpen: (subject: DialogSubject) => void;
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
        {page.recommendations.length === 0 ? (
          <Dash />
        ) : (
          <Button
            variant="outline"
            className="tabular-nums"
            onClick={() =>
              onOpen({
                title: page.title,
                url: page.url,
                fragments: page.recommendations,
              })
            }
          >
            {toLabel(page)}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function toLabel(page: Extract<ReportPage, { status: "scored" }>): string {
  const count = page.recommendations.length;
  const last = count % 10;
  const tens = count % 100;
  if (tens >= 11 && tens <= 14) return `${count} абзацев`;
  if (last === 1) return `${count} абзац`;
  if (last >= 2 && last <= 4) return `${count} абзаца`;
  return `${count} абзацев`;
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
