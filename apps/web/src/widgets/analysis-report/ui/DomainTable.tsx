import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import type { AnalysisDomainRow } from "../model/analysis-report";
import { ColumnHelp } from "./ColumnHelp";
import { formatPercent, formatScore } from "./report-format";

export function DomainTable({ domains }: { domains: AnalysisDomainRow[] }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-semibold">
        Домены целиком — стоит ли смотреть этого конкурента
      </h3>
      <div className="overflow-hidden rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Домен</TableHead>
              <TableHead className="text-right">
                <ColumnHelp
                  label="Новизна"
                  formula="Σ(релевантность × (1 − сходство)) ÷ Σ(релевантность) по всем фрагментам домена"
                  note="Относительная величина: сходство считается до ближайшего фрагмента вашего домена, поэтому число зависит от того, что обход нашёл у вас. Покрытие = 100% − новизна."
                />
              </TableHead>
              <TableHead className="text-right">
                <ColumnHelp
                  label="Релевантность"
                  formula="среднее cos(эмбеддинг запроса, эмбеддинг фрагмента) по всем фрагментам домена"
                  note="Абсолютная величина: не зависит от второго домена и сравнима между прогонами. Ниже 0.25 — уровень несвязанного с запросом текста."
                />
              </TableHead>
              <TableHead className="text-right">Страниц</TableHead>
              <TableHead className="text-right">Фрагментов</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((domain) => (
              <TableRow key={domain.domain}>
                <TableCell>
                  <span className="font-semibold">{domain.domain}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {domain.ours ? "наш сайт" : "конкурент"}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {domain.novelty === undefined
                    ? "—"
                    : formatPercent(domain.novelty)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatScore(domain.relevance)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {domain.pageCount}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {domain.fragmentCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
