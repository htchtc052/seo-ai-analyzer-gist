import type { FailedAnalysis } from "./analysis";

export type AnalysisFailureReport = {
  summary: string;
  url: string | null;
  detail: string | null;
};

export function analysisFailureReport(
  run: FailedAnalysis,
): AnalysisFailureReport {
  if (run.error.reason === "internal")
    return {
      summary: "Сбой на стороне сервиса, подробности в логах backend",
      url: run.error.url,
      detail: run.error.detail,
    };

  const summary =
    run.error.reason === "empty"
      ? "На странице не нашлось читаемого текста статьи. Так выглядит JavaScript-приложение или закрытый раздел: рендеринг JS не поддерживается."
      : "Страница не открылась.";

  return { summary, url: run.error.url, detail: run.error.detail };
}
