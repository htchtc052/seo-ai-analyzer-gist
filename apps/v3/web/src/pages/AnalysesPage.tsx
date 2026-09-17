import { Link } from "react-router";
import { useAnalyses } from "@/entities/analysis";
import { AnalysisForm, useStartAnalysis } from "@/features/start-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export function AnalysesPage() {
  const { start, isStarting, error } = useStartAnalysis();
  const analyses = useAnalyses();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Новое сравнение</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalysisForm
            onSubmit={start}
            isStarting={isStarting}
            error={error}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Запуски</CardTitle>
        </CardHeader>
        <CardContent>
          {analyses.isPending && (
            <p className="text-muted-foreground">Грузим…</p>
          )}
          {analyses.isError && (
            <p className="text-muted-foreground">Сервис недоступен</p>
          )}
          {analyses.data?.length === 0 && (
            <p className="text-muted-foreground">Пока ничего не запускали.</p>
          )}
          <ul className="grid gap-3">
            {analyses.data?.map((run) => (
              <li key={run.id} className="border-b pb-3 last:border-0">
                <Link to={`/analyses/${run.id}`} className="group grid gap-0.5">
                  <span className="font-medium group-hover:text-primary">
                    {run.searchQuery}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    конкурентов: {run.competitorCount} · {run.status} ·{" "}
                    {new Date(run.createdAt).toLocaleString("ru-RU")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
