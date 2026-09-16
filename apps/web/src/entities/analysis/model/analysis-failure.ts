import type { FailedAnalysis } from "./analysis";

export function analysisFailureMessage(run: FailedAnalysis): string {
  if (run.error.site === null) return "Сбой на стороне сервиса";

  const url =
    run.error.site === "primary" ? run.primarySiteUrl : run.competitorSiteUrl;
  const owner = run.error.site === "primary" ? "ваш сайт" : "сайт конкурента";

  if (run.error.reason === "empty")
    return `На сайте ${url} не нашлось страниц с читаемым текстом. Так выглядит JavaScript-приложение или закрытый раздел: рендеринг JS не поддерживается.`;
  return `Не удалось открыть ${owner} ${url}`;
}
