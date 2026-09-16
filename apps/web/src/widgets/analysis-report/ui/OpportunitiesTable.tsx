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
  Info,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import type { AnalysisPageRow } from "../model/analysis-report";
import { formatPercent, formatScore } from "./report-format";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});
const columnHelper = createColumnHelper<typeof features, AnalysisPageRow>();
const columns = columnHelper.columns([
  columnHelper.accessor("domain", {
    header: ({ column }) => (
      <SortHeader
        label="Домен"
        help="Строки вашего домена и домена конкурента в одной таблице. У ваших страниц оценка и покрытие не считаются: они и есть то, с чем сравнивается конкурент."
        direction={column.getIsSorted()}
        onSort={() => column.toggleSorting()}
      />
    ),
    cell: ({ row }) => (
      <span
        className={
          row.original.ours
            ? "text-xs whitespace-nowrap text-muted-foreground"
            : "text-xs font-medium whitespace-nowrap text-primary"
        }
      >
        {row.original.domain}
        {row.original.ours ? " · ваш" : ""}
      </span>
    ),
  }),
  columnHelper.accessor("title", {
    header: ({ column }) => (
      <SortHeader
        label="Страница"
        direction={column.getIsSorted()}
        onSort={() => column.toggleSorting()}
      />
    ),
    cell: ({ row }) => (
      <a
        href={row.original.url}
        target="_blank"
        rel="noreferrer"
        className="grid min-w-64 max-w-xl gap-1 whitespace-normal group"
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
  columnHelper.accessor("score", {
    header: ({ column }) => (
      <SortHeader
        label="Оценка"
        help="Средняя оценка пяти лучших фрагментов страницы. Оценка фрагмента — релевантность × (1 − сходство), обе величины косинусные: релевантность до эмбеддинга запроса, сходство до ближайшего фрагмента вашего домена. Среднее по лучшим, а не сумма по всем: иначе длинная статья обгоняет короткую за счёт объёма, а колонка «Фрагментов» рядом показывает глубину."
        direction={column.getIsSorted()}
        onSort={() => column.toggleSorting()}
      />
    ),
    sortUndefined: "last",
    cell: ({ getValue }) => (
      <NumberCell value={getValue()} format={formatScore} emphasized />
    ),
  }),
  columnHelper.accessor("bestScore", {
    header: ({ column }) => (
      <SortHeader
        label="Лучший фрагмент"
        help="Наибольшая оценка среди фрагментов страницы. Высокое значение при низкой сумме означает одну ценную врезку, а не целую статью."
        direction={column.getIsSorted()}
        onSort={() => column.toggleSorting()}
      />
    ),
    sortUndefined: "last",
    cell: ({ getValue }) => (
      <NumberCell value={getValue()} format={formatScore} />
    ),
  }),
  columnHelper.accessor("meanRelevance", {
    header: ({ column }) => (
      <SortHeader
        label="Релевантность"
        help="Косинусная близость эмбеддинга фрагмента к эмбеддингу поискового запроса, усреднённая по странице. Модель указана над отчётом."
        direction={column.getIsSorted()}
        onSort={() => column.toggleSorting()}
      />
    ),
    cell: ({ getValue }) => (
      <NumberCell value={getValue()} format={formatScore} />
    ),
  }),
  columnHelper.accessor("coverage", {
    header: ({ column }) => (
      <SortHeader
        label="Уже есть у нас"
        help="Для каждого фрагмента берётся наибольшая косинусная близость к фрагментам вашего домена. Среднее по странице взвешено по релевантности: далёкие от темы фрагменты почти не влияют на долю."
        direction={column.getIsSorted()}
        onSort={() => column.toggleSorting()}
      />
    ),
    sortUndefined: "last",
    cell: ({ getValue }) => (
      <NumberCell value={getValue()} format={formatPercent} />
    ),
  }),
  columnHelper.accessor("fragmentCount", {
    header: ({ column }) => (
      <SortHeader
        label="Фрагментов"
        help="Сколько текстовых фрагментов извлечено со страницы и отправлено в модель эмбеддингов."
        direction={column.getIsSorted()}
        onSort={() => column.toggleSorting()}
      />
    ),
    cell: ({ getValue }) => <NumberCell value={getValue()} format={String} />,
  }),
]);

export function OpportunitiesTable({ pages }: { pages: AnalysisPageRow[] }) {
  const table = useTable({
    features,
    columns,
    data: pages,
    getRowId: (row) => row.id,
    initialState: { sorting: [{ id: "score", desc: true }] },
    enableSortingRemoval: false,
    enableMultiSort: false,
  });

  return (
    <section className="grid gap-3">
      <div>
        <h3 className="font-semibold">Страницы обоих доменов</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Сначала страницы конкурента с наибольшей оценкой, затем ваши. Оценка
          конкурента считается относительно ваших страниц из этой же таблицы:
          если среди них нет материалов по теме, оценка завышена. Сам текст
          читается по ссылке.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function NumberCell({
  value,
  format,
  emphasized = false,
}: {
  value: number | undefined;
  format: (value: number) => string;
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
      {value === undefined ? "—" : format(value)}
    </span>
  );
}

function SortHeader({
  label,
  help,
  direction,
  onSort,
}: {
  label: string;
  help?: string;
  direction: false | "asc" | "desc";
  onSort: () => void;
}) {
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
        onClick={onSort}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        <Icon className="size-3.5" />
      </button>
      {help && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Пояснение"
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{help}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
