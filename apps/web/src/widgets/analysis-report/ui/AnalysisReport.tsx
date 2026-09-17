import { useState } from "react";
import { useMemo } from "react";
import type { CompletedAnalysis } from "@/entities/analysis";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { buildAnalysisReport } from "../model/analysis-report";
import { DomainTable } from "./DomainTable";
import { PageTable } from "./PageTable";
import { RelevanceThreshold } from "./RelevanceThreshold";
import { formatScore } from "./report-format";

const DEFAULT_THRESHOLD = 0.25;

export function AnalysisReport({ run }: { run: CompletedAnalysis }) {
  const report = useMemo(() => buildAnalysisReport(run), [run]);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const reached = report.pages.filter(
    (page) => !page.ours && page.relevance >= threshold,
  ).length;

  return (
    <TooltipProvider>
      <div className="grid gap-6">
        <DomainTable domains={report.domains} model={run.semantic.model} />

        <RelevanceThreshold value={threshold} onChange={setThreshold} />

        {reached === 0 && (
          <Alert variant="destructive">
            <AlertTitle>Домен конкурента не раскрывает тему</AlertTitle>
            <AlertDescription>
              Ни одна его страница не дотянула до порога{" "}
              {formatScore(threshold)}. Всё, что ниже, — справка о том, что
              обход посмотрел; рекомендовать из этого нечего.
            </AlertDescription>
          </Alert>
        )}

        <PageTable pages={report.pages} threshold={threshold} />
      </div>
    </TooltipProvider>
  );
}
