import { AlertCircle } from "lucide-react";
import { useParams } from "react-router";
import {
  analysisFailureReport,
  AnalysisProgress,
  useAnalysis,
} from "@/entities/analysis";
import { DeleteAnalysisButton } from "@/features/delete-analysis";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { AnalysisReport } from "@/widgets/analysis-report";

export function AnalysisPage() {
  const { id } = useParams();
  const { run, isLoading, error } = useAnalysis(id);

  if (isLoading) return <p className="text-muted-foreground">Грузим…</p>;
  if (error || !run)
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>{error ?? "Анализ не найден"}</AlertDescription>
      </Alert>
    );

  return (
    <div className="grid gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold">{run.searchQuery}</h1>
          <p className="text-sm text-muted-foreground">
            наша страница {run.primaryUrl} · конкурентов{" "}
            {run.competitorUrls.length}
          </p>
        </div>
        <DeleteAnalysisButton id={run.id} searchQuery={run.searchQuery} />
      </header>

      <AnalysisProgress run={run} />

      {run.status === "failed" && (
        <Failure report={analysisFailureReport(run)} />
      )}
      {run.status === "completed" && <AnalysisReport run={run} />}
    </div>
  );
}

function Failure({
  report,
}: {
  report: { summary: string; url: string | null; detail: string | null };
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Анализ остановлен</AlertTitle>
      <AlertDescription className="grid gap-1">
        <span>{report.summary}</span>
        {report.url && (
          <span className="text-xs">
            Адрес: <span className="font-mono">{report.url}</span>
          </span>
        )}
        {report.detail && <span className="text-xs">{report.detail}</span>}
      </AlertDescription>
    </Alert>
  );
}
