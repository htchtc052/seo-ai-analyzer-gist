import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Star,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import type { AnalysisPageRow } from "../model/analysis-report";
import { ColumnHelp } from "./ColumnHelp";
import { formatPercent, formatScore } from "./report-format";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});
const columnHelper = createColumnHelper<typeof features, AnalysisPageRow>();

const columns = columnHelper.columns([
  columnHelper.accessor("domain", {
    header: ({ column }) => <SortHeader label="Домен" column={column} />,
    cell: ({ row }) => (
      <span className="text-xs whitespace-nowrap">
        <span className="font-semibold">{row.original.domain}</span>
        <span className="block text-muted-foreground">
          {row.original.ours ? "наш сайт" : "конкурент"}
        </span>
      </span>
    ),
  }),
  columnHelper.accessor("title", {
    header: ({ column }) => <SortHeader label="Страница" column={column} />,
    cell: ({ row }) => (
      <a
        href={row.original.url}
        target="_blank"
        rel="noreferrer"
        className="group grid min-w-64 max-w-xl gap-1 whitespace-normal"
      >
        <span className="flex items-start gap-2 font-medium leading-5 group-hover:text-primary">
          {row.original.title}
          <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {row.original.url}
        </span>
      </a>
    ),
  }),
  columnHelper.accessor("priority", {
    header: ({ column }) => (
      <SortHeader
        label="Приоритет"
        column={column}
        formula="релевантность × новизна"
        note="Порядок чтения таблицы. Относительная величина: новизна зависит от того, что обход нашёл у вас. Процент выбран как признак относительности, долей чего-либо приоритет не является."
      />
    ),
    sortUndefined: "last",
    cell: ({ getValue }) => <Percent value={getValue()} emphasized />,
  }),
  columnHelper.accessor("novelty", {
    header: ({ column }) => (
      <SortHeader
        label="Новизна"
        column={column}
        formula="Σ(релевантность × (1 − сходство)) ÷ Σ(релевантность)"
        note="Какая доля релевантного содержания страницы не похожа на ваш домен. Сходство — наибольший cos до фрагментов вашего домена, поэтому величина относительна. Покрытие = 100% − новизна."
      />
    ),
    sortUndefined: "last",
    cell: ({ getValue }) => <Percent value={getValue()} />,
  }),
  columnHelper.accessor("relevance", {
    header: ({ column }) => (
      <SortHeader
        label="Релевантность"
        column={column}
        formula="среднее cos(эмбеддинг запроса, эмбеддинг фрагмента)"
        note="Абсолютная величина: не зависит от второго домена и сравнима между прогонами, поэтому порог стоит именно на ней. Косинус — близость векторов, а не доля, и процентом не показывается."
      />
    ),
    cell: ({ getValue }) => <Cosine value={getValue()} />,
  }),
  columnHelper.accessor("bestFragment", {
    header: ({ column }) => (
      <SortHeader
        label="Лучший фрагмент"
        column={column}
        formula="max(релевантность × (1 − сходство)) по фрагментам страницы"
        note="Ловит одну ценную врезку на в остальном посредственной странице — среднее её размывает."
      />
    ),
    sortUndefined: "last",
    cell: ({ getValue }) => <Cosine value={getValue()} />,
  }),
  columnHelper.accessor("pageDate", {
    header: ({ column }) => (
      <SortHeader
        label="Дата"
        column={column}
        formula="мета-тег страницы, при его отсутствии — lastmod карты сайта"
        note="Источник подписан под датой. lastmod часто означает пересборку страницы, а не публикацию, поэтому это справка, а не факт. На расчёт дата не влияет."
      />
    ),
    sortUndefined: "last",
    cell: ({ row }) => <PageDate page={row.original} />,
  }),
  columnHelper.accessor("fragmentCount", {
    header: ({ column }) => (
      <SortHeader
        label="Фрагментов"
        column={column}
        formula="число извлечённых абзацев страницы"
        note="Глубина страницы. На приоритет и новизну не влияет: обе величины — средние, а не суммы."
      />
    ),
    cell: ({ getValue }) => (
      <span className="block text-right tabular-nums">{getValue()}</span>
    ),
  }),
]);

type PageTableProps = {
  pages: AnalysisPageRow[];
  threshold: number;
};

export function PageTable({ pages, threshold }: PageTableProps) {
  const table = useTable({
    features,
    columns,
    data: pages,
    getRowId: (row) => row.id,
    initialState: { sorting: [{ id: "priority", desc: true }] },
    enableSortingRemoval: false,
    enableMultiSort: false,
  });

  return (
    <section className="grid gap-3">
      <h3 className="text-sm font-semibold">
        Страницы — что именно смотреть. Подсвечено то, что рекомендуем
      </h3>
      <div className="overflow-hidden rounded-lg border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead />
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const recommended =
                !row.original.ours && row.original.relevance >= threshold;
              return (
                <TableRow
                  key={row.id}
                  className={recommended ? "bg-primary/5" : undefined}
                >
                  <TableCell>
                    {recommended && (
                      <Star
                        className="size-3.5 text-primary"
                        aria-label="Рекомендуем"
                      />
                    )}
                  </TableCell>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function PageDate({ page }: { page: AnalysisPageRow }) {
  const date = page.pageDate ?? page.sitemapLastmod;
  if (!date) return <span className="block text-right">—</span>;
  return (
    <span className="block text-right text-xs whitespace-nowrap">
      <span className="tabular-nums">{date.slice(0, 10)}</span>
      <span className="block text-muted-foreground">
        {page.pageDate
          ? (page.pageDateSource ?? "мета-тег")
          : "sitemap lastmod"}
      </span>
    </span>
  );
}

function Percent({
  value,
  emphasized = false,
}: {
  value: number | undefined;
  emphasized?: boolean;
}) {
  return (
    <span
      className={
        emphasized
          ? "block text-right font-semibold tabular-nums text-primary"
          : "block text-right tabular-nums"
      }
    >
      {value === undefined ? "—" : formatPercent(value)}
    </span>
  );
}

function Cosine({ value }: { value: number | undefined }) {
  return (
    <span className="block text-right tabular-nums">
      {value === undefined ? "—" : formatScore(value)}
    </span>
  );
}

function SortHeader({
  label,
  column,
  formula,
  note,
}: {
  label: string;
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: () => void;
  };
  formula?: string;
  note?: string;
}) {
  const direction = column.getIsSorted();
  const Icon =
    direction === "asc"
      ? ArrowUp
      : direction === "desc"
        ? ArrowDown
        : ArrowUpDown;
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => column.toggleSorting()}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {formula && note ? (
          <ColumnHelp label={label} formula={formula} note={note} />
        ) : (
          label
        )}
        <Icon className="size-3.5" />
      </button>
    </span>
  );
}
