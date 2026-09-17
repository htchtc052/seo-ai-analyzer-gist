import type { ArticleRef } from "@/entities/article";

export type RecommendationJobState =
  | "waiting"
  | "waiting-children"
  | "prioritized"
  | "delayed"
  | "active"
  | "completed"
  | "failed"
  | "unknown";

export type RecommendationJob = {
  state: RecommendationJobState;
  failedReason: string | null;
};

export type FragmentScore = {
  heading: string | null;
  text: string;
  score: number;
};

export type AnalysisRunSummary = {
  id: string;
  article: ArticleRef;
  query: string;
  overallScore: number;
  competitorCount: number;
  recommendations: string[];
  recommendationJob: RecommendationJob | null;
  createdAt: string;
};

export type AnalysisRun = Omit<AnalysisRunSummary, "competitorCount"> & {
  competitors: ArticleRef[];
  audience: string;
  purpose: string;
  niche: string;
  fragments: FragmentScore[];
  missingEntities: string[];
};
