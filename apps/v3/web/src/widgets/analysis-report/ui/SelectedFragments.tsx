import type { CompletedAnalysis, Recommendation } from "@/entities/analysis";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { ColumnHelp } from "./ColumnHelp";
import type { DialogSubject } from "./FragmentDialog";
import { formatPercent, formatScore } from "./report-format";

type Picked = Recommendation & { pageTitle: string; pageUrl: string };

export function SelectedFragments({
  run,
  poolSize,
  onOpen,
}: {
  run: CompletedAnalysis;
  poolSize: number;
  onOpen: (subject: DialogSubject) => void;
}) {
  const picked: Picked[] = run.pages
    .filter((page) => page.status === "scored")
    .flatMap((page) =>
      page.recommendations.map((item) => ({
        ...item,
        pageTitle: page.title,
        pageUrl: page.url,
      })),
    )
    .toSorted((left, right) => left.rank - right.rank);

  if (picked.length === 0) return null;

  return (
    <section className="grid gap-3">
      <h2 className="font-semibold">Что добавить</h2>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <ColumnHelp
                  label="Абзац"
                  formula={`выбрано ${picked.length} из ${poolSize} абзацев всех конкурентов`}
                  note="GIST берёт абзацы, которые ценны и при этом не повторяют друг друга, — поэтому он может пропустить более ценный абзац, если тот говорит о том же, что уже взято. Отбор идёт сразу по всем конкурентам, а не по страницам. Нажмите строку, чтобы прочитать абзац целиком."
                />
              </TableHead>
              <TableHead className="text-right">
                <ColumnHelp
                  label="Релевантность"
                  reference="абзаца запросу"
                  formula="cos(запрос, абзац)"
                  note="Насколько абзац про запрос. Величина абсолютная, её диапазоны задаёт модель."
                />
              </TableHead>
              <TableHead className="text-right">
                <ColumnHelp
                  label="Новизна"
                  reference="абзаца относительно нашей страницы"
                  formula="1 − наибольший cos до абзацев нашей страницы"
                  note="Насколько этому абзацу нечего противопоставить у нас. Величина относительна: зависит от того, что написано именно у нас."
                />
              </TableHead>
              <TableHead className="text-right">
                <ColumnHelp
                  label="Ценность"
                  reference="абзаца для отбора"
                  formula="релевантность × новизна"
                  note="Это число мы передаём в GIST как ценность абзаца. Приоритет страницы в таблице ниже — среднее таких чисел по всем её абзацам."
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {picked.map((item) => (
              <TableRow
                key={item.rank}
                onClick={() =>
                  onOpen({
                    title: item.pageTitle,
                    url: item.pageUrl,
                    fragments: [item],
                  })
                }
                className="cursor-pointer"
              >
                <TableCell>
                  <span className="grid max-w-2xl gap-0.5 whitespace-normal">
                    <span className="text-xs text-muted-foreground">
                      {item.pageTitle}
                      {item.heading && ` · ${item.heading}`}
                    </span>
                    <span className="line-clamp-1 text-sm">{item.text}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatScore(item.relevance)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(item.novelty)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatScore(item.priority)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
