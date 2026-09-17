import { ChevronDown, ExternalLink } from "lucide-react";
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
import { cn } from "cn";
import { ColumnHelp } from "./ColumnHelp";
import { SelectedFragments } from "./SelectedFragments";
import { formatPercent, formatScore } from "./report-format";

export function AnalysisReport({ run }: { run: CompletedAnalysis }) {
  const [opened, setOpened] = useState<string | null>(null);
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
        <SelectedFragments run={run} poolSize={poolSize} />

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
                  <TableHead className="text-right">Вклад</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {run.pages.map((page) => (
                  <Row
                    key={page.url}
                    page={page}
                    opened={opened === page.url}
                    onToggle={() =>
                      setOpened(opened === page.url ? null : page.url)
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}

function Row({
  page,
  opened,
  onToggle,
}: {
  page: ReportPage;
  opened: boolean;
  onToggle: () => void;
}) {
  if (page.status === "failed") return <FailedRow page={page} />;

  return (
    <>
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
          {page.ours ? (
            <Dash />
          ) : (
            <Button
              variant="outline"
              onClick={onToggle}
              aria-expanded={opened}
              className="tabular-nums"
            >
              {toLabel(page)}
              <ChevronDown
                className={cn("transition-transform", opened && "rotate-180")}
              />
            </Button>
          )}
        </TableCell>
      </TableRow>

      {opened && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={4}>
            <Contribution page={page} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function Contribution({
  page,
}: {
  page: Extract<ReportPage, { status: "scored" }>;
}) {
  const ranks = page.recommendations.map((item) => item.rank);

  return (
    <div className="grid max-w-3xl gap-2 py-1 text-sm">
      <p>
        Приоритет страницы{" "}
        <span className="font-medium tabular-nums">
          {formatScore(page.priority ?? 0)}
        </span>{" "}
        — среднее приоритетов её {page.fragmentCount} абзацев. Приоритет абзаца
        это его релевантность, умноженная на новизну; это же число уходит в GIST
        как ценность.
      </p>
      {ranks.length > 0 ? (
        <p>
          Наверх попали абзацы{" "}
          <span className="font-medium">
            {ranks.map((rank) => `№${rank}`).join(", ")}
          </span>
          .
        </p>
      ) : (
        <p className="text-muted-foreground">
          Наверх не попало ничего. Отбор идёт по абзацам всех конкурентов сразу
          и отбрасывает те, что повторяют уже взятое, — значит сильные абзацы
          этой страницы говорят о том же, что нашлось у другой. Приоритет тут ни
          при чём: он про страницу целиком.
        </p>
      )}
    </div>
  );
}

function toLabel(page: Extract<ReportPage, { status: "scored" }>): string {
  const count = page.recommendations.length;
  if (count === 0) return "нет абзацев";
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
