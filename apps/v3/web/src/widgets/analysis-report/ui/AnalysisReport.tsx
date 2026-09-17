import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import type {
  CompletedAnalysis,
  ReportFragment,
  ReportPage,
} from "@/entities/analysis";
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
import { formatPercent, formatScore } from "./report-format";

type SortKey = "relevance" | "novelty" | "priority";

export function AnalysisReport({ run }: { run: CompletedAnalysis }) {
  const [onlyPicked, setOnlyPicked] = useState(true);
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({
    key: "priority",
    desc: true,
  });

  function toggle(key: SortKey) {
    setSort(sort.key === key ? { key, desc: !sort.desc } : { key, desc: true });
  }

  const picked = run.pages.reduce(
    (total, page) =>
      page.status === "scored"
        ? total + page.fragments.filter((item) => item.recommended).length
        : total,
    0,
  );
  const poolSize = run.pages.reduce(
    (total, page) =>
      page.status === "scored" ? total + page.fragments.length : total,
    0,
  );

  return (
    <TooltipProvider>
      <section className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 className="font-semibold">Что добавить</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              модель {run.model}
            </span>
            <Button
              variant="outline"
              onClick={() => setOnlyPicked(!onlyPicked)}
              aria-pressed={onlyPicked}
            >
              {onlyPicked
                ? `Показать все ${poolSize} абзацев`
                : `Только рекомендованные (${picked})`}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <ColumnHelp
                    label="Страница и абзацы"
                    formula={`GIST выбрал ${picked} абзацев из ${poolSize}`}
                    note="Отбор идёт сразу по абзацам всех конкурентов, а не по страницам: берутся ценные и при этом не повторяющие друг друга. Поэтому у страницы может не оказаться ни одного выбранного абзаца, даже если она выше по релевантности — значит её сильные абзацы говорят о том же, что уже взято у другой."
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortHeader
                    active={sort.key === "relevance"}
                    desc={sort.desc}
                    onClick={() => toggle("relevance")}
                  />
                  <ColumnHelp
                    label="Релевантность"
                    reference="запросу"
                    formula="у абзаца — cos(запрос, абзац); у страницы — среднее по её абзацам"
                    note="Насколько текст про запрос. Величина абсолютная: её диапазоны задаёт модель, поэтому она сравнима между запусками. Около 0.25 — уровень текста, не связанного с запросом."
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortHeader
                    active={sort.key === "novelty"}
                    desc={sort.desc}
                    onClick={() => toggle("novelty")}
                  />
                  <ColumnHelp
                    label="Новизна"
                    reference="относительно нашей страницы"
                    formula="у абзаца — 1 − наибольший cos до наших абзацев; у страницы — среднее, взвешенное релевантностью"
                    note="Какой доле текста нечего противопоставить у нас. Величина относительна: зависит от того, что написано именно у нас. Короткий абзац почти всегда выглядит новее длинного — совпасть ему не с чем."
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortHeader
                    active={sort.key === "priority"}
                    desc={sort.desc}
                    onClick={() => toggle("priority")}
                  />
                  <ColumnHelp
                    label="Ценность"
                    formula="релевантность × новизна"
                    note="Ценность абзаца — это число мы передаём в GIST как вес при отборе. Ценность страницы — среднее ценностей её абзацев, то есть её приоритет как источника."
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortPages(run.pages, sort).map((page) => (
                <PageRows
                  key={page.url}
                  page={page}
                  onlyPicked={onlyPicked}
                  sort={sort}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </TooltipProvider>
  );
}

function PageRows({
  page,
  onlyPicked,
  sort,
}: {
  page: ReportPage;
  onlyPicked: boolean;
  sort: { key: SortKey; desc: boolean };
}) {
  if (page.status === "failed") return <FailedRow page={page} />;

  const shown = (
    onlyPicked
      ? page.fragments.filter((item) => item.recommended)
      : page.fragments
  ).toSorted((left, right) =>
    compare(left[sort.key], right[sort.key], sort.desc),
  );

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
        <TableCell className="text-right font-medium tabular-nums">
          {page.priority === null ? <Dash /> : formatScore(page.priority)}
        </TableCell>
      </TableRow>

      {shown.map((item, index) => (
        <FragmentRow key={index} fragment={item} />
      ))}
    </>
  );
}

function FragmentRow({ fragment }: { fragment: ReportFragment }) {
  return (
    <TableRow
      className={cn(
        "text-muted-foreground",
        fragment.recommended && "bg-primary/5 text-foreground",
      )}
    >
      <TableCell className="pl-10">
        <span className="grid max-w-2xl gap-0.5 whitespace-normal">
          {fragment.heading && (
            <span className="text-xs text-muted-foreground">
              {fragment.heading}
            </span>
          )}
          <span className="flex gap-2 text-sm">
            <ChevronRight
              className={cn(
                "mt-1 size-3.5 shrink-0",
                fragment.recommended ? "text-primary" : "opacity-40",
              )}
            />
            <span className={cn(!fragment.recommended && "line-clamp-2")}>
              {fragment.text}
            </span>
          </span>
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatScore(fragment.relevance)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatPercent(fragment.novelty)}
      </TableCell>
      <TableCell
        className={cn(
          "text-right tabular-nums",
          fragment.recommended && "font-medium",
        )}
      >
        {formatScore(fragment.priority)}
      </TableCell>
    </TableRow>
  );
}

function SortHeader({
  active,
  desc,
  onClick,
}: {
  active: boolean;
  desc: boolean;
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : desc ? ArrowDown : ArrowUp;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Сортировать"
      className={cn(
        "mr-1 align-middle",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function sortPages(
  pages: ReportPage[],
  sort: { key: SortKey; desc: boolean },
): ReportPage[] {
  const scored = pages.filter((page) => page.status === "scored");
  return [
    ...scored.filter((page) => page.ours),
    ...scored
      .filter((page) => !page.ours)
      .toSorted((left, right) =>
        compare(left[sort.key] ?? 0, right[sort.key] ?? 0, sort.desc),
      ),
    ...pages.filter((page) => page.status === "failed"),
  ];
}

function compare(left: number, right: number, desc: boolean): number {
  return desc ? right - left : left - right;
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
