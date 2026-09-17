import type { AnalysisRun } from "@/entities/analysis-run";
import type { Article } from "@/entities/article";
import { apiClient } from "@/shared/api";
import type { StartAnalysisDto } from "../contract/start-analysis.contract";

export type Features = { recommendations: boolean };

export async function importArticle(url: string): Promise<Article> {
  const { article } = await apiClient<{ article: Article }>(
    "/articles/import",
    { method: "POST", body: { url } },
  );
  return article;
}

export async function startAnalysis(
  input: StartAnalysisDto,
): Promise<AnalysisRun> {
  const { run } = await apiClient<{ run: AnalysisRun }>("/analyses", {
    method: "POST",
    body: input,
  });
  return run;
}

export async function getFeatures(): Promise<Features> {
  const { features } = await apiClient<{ features: Features }>(
    "/analyses/features",
  );
  return features;
}
