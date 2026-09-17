import { useMemo, useState } from "react";
import type { CompletedAnalysis } from "@/entities/analysis";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { TooltipProvider } from "@/shared/ui/tooltip";
import {
  buildAnalysisReport,
  summarizeDomains,
} from "../model/analysis-report";
import { DomainTable } from "./DomainTable";
import { PageTable } from "./PageTable";
import { ReportControls } from "./ReportControls";
import { formatScore } from "./report-format";

const DEFAULT_THRESHOLD = 0.25;

export function AnalysisReport({ run }: { run: CompletedAnalysis }) {
  const report = useMemo(() => buildAnalysisReport(run), [run]);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [since, setSince] = useState("");

  const pages = useMemo(
    () =>
      since === ""
        ? report.pages
        : report.pages.filter(
            (page) => page.pageDate === null || page.pageDate >= since,
          ),
    [report.pages, since],
  );
  const domains = useMemo(() => summarizeDomains(pages), [pages]);
  const recommended = pages.filter(
    (page) => !page.ours && page.relevance >= threshold,
  ).length;

  return (
    <TooltipProvider>
      <div className="grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">
          «{run.searchQuery}» · {report.pages.length} страниц ·{" "}
          {run.semantic.primary.length + run.semantic.competitor.length}{" "}
          фрагментов · {run.semantic.model}
        </p>

        <DomainTable domains={domains} />

        <ReportControls
          threshold={threshold}
          onThreshold={setThreshold}
          since={since}
          onSince={setSince}
        />

        {recommended === 0 && (
          <Alert variant="destructive">
            <AlertTitle>Рекомендовать нечего</AlertTitle>
            <AlertDescription>
              Ни одна страница конкурента не дотянула до порога{" "}
              {formatScore(threshold)}. Всё ниже — справка о том, что обход
              посмотрел.
            </AlertDescription>
          </Alert>
        )}

        <PageTable pages={pages} threshold={threshold} />
      </div>
    </TooltipProvider>
  );
}
