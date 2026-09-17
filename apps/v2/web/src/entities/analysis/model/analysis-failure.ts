import type { FailedAnalysis } from "./analysis";

export type AnalysisFailureReport = {
  summary: string;
  url: string | null;
  detail: string | null;
};

export function analysisFailureReport(
  run: FailedAnalysis,
): AnalysisFailureReport {
  if (run.error.site === null)
    return {
      summary: "Сбой на стороне сервиса, подробности в логах backend",
      url: null,
      detail: null,
    };

  const owner = run.error.site === "primary" ? "вашего сайта" : "конкурента";
  const summary =
    run.error.reason === "empty"
      ? `Обход ${owner} не нашёл ни одной страницы с читаемым текстом. Так выглядит JavaScript-приложение или закрытый раздел: рендеринг JS не поддерживается.`
      : `Обход ${owner} прервался: страница не открылась.`;

  return { summary, url: run.error.url, detail: run.error.detail };
}
