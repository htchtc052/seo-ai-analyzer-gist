import { useEffect, useMemo, useRef, useState } from "react";
import { useAnalysis } from "@/entities/analysis/useAnalysis";
import { createAnalysisReport } from "@/entities/analysis/model/report";
import { AnalysisForm } from "@/features/start-analysis/ui/AnalysisForm";
import { AnalysisReportView } from "@/widgets/analysis-report/ui/AnalysisReportView";

export function App() {
  const [id, setId] = useState<string | null>(null);
  const { run, error } = useAnalysis(id);
  const running = run?.status === "running" || (Boolean(id) && !run && !error);
  const reportRef = useRef<HTMLDivElement>(null);
  const report = useMemo(
    () => (run?.status === "completed" ? createAnalysisReport(run) : null),
    [run],
  );

  useEffect(() => {
    if (report) reportRef.current?.scrollIntoView({ block: "start" });
  }, [report]);

  return (
    <div className="sa-root">
      <h1 className="sa-title">Сравнение страницы с конкурентами</h1>
      <AnalysisForm disabled={running} onStarted={setId} />

      {error && <p className="sa-error">{error}</p>}

      {running && (
        <p className="sa-progress">
          {run?.status === "running"
            ? run.stage === "loading"
              ? `Загружаем страницы: ${run.progress.done} из ${run.progress.total}`
              : "Считаем векторы"
            : "Отправляем запрос…"}
        </p>
      )}

      {run?.status === "failed" && (
        <p className="sa-error">Анализ не выполнен: {run.detail}</p>
      )}

      {report && run?.status === "completed" && (
        <div ref={reportRef} className="sa-section">
          <AnalysisReportView key={run.id} report={report} query={run.query} />
        </div>
      )}
    </div>
  );
}
