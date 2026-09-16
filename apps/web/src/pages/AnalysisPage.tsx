import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useParams } from "react-router";
import type { AnalysisRun } from "@/entities/analysis";
import {
  analysisFailureReport,
  AnalysisProgress,
  useAnalysis,
} from "@/entities/analysis";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { AnalysisReport } from "@/widgets/analysis-report";

function FailureAlert({
  run,
}: {
  run: Extract<AnalysisRun, { status: "failed" }>;
}) {
  const failure = analysisFailureReport(run);
  return (
    <Alert variant="destructive">
      <AlertTitle>Анализ не выполнен</AlertTitle>
      <AlertDescription>
        <span className="block">{failure.summary}</span>
        {failure.url && (
          <span className="mt-2 block">
            Остановились на <code className="break-all">{failure.url}</code>
          </span>
        )}
        {failure.detail && (
          <span className="mt-1 block text-xs">
            Ответ сервера: <code>{failure.detail}</code>
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}

function hostname(url: string): string {
  return new URL(url).hostname;
}

export function AnalysisPage() {
  const { id } = useParams();
  const { run, isLoading, error } = useAnalysis(id);

  return (
    <div className="grid gap-6">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Все отчёты
      </Link>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Отчёт недоступен</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && (
        <p className="text-sm text-muted-foreground">Загружаем состояние…</p>
      )}
      {run && (
        <>
          <header className="grid gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              {run.searchQuery}
            </h1>
            <p className="text-sm text-muted-foreground">
              Домен {hostname(run.primarySiteUrl)} против домена{" "}
              {hostname(run.competitorSiteUrl)} · до {run.maxPagesPerSite}{" "}
              страниц с каждого
            </p>
          </header>
          <AnalysisProgress run={run} />
          {run.status === "completed" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-primary" />
                  Анализ завершён
                </CardTitle>
                <CardDescription>
                  Обработано{" "}
                  {run.semantic.primary.length + run.semantic.competitor.length}{" "}
                  фрагментов моделью {run.semantic.model}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalysisReport run={run} />
              </CardContent>
            </Card>
          )}
          {run.status === "failed" && <FailureAlert run={run} />}
        </>
      )}
    </div>
  );
}
