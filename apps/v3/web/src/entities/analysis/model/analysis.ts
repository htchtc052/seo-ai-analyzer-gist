import { z } from "zod";

const pageUrlSchema = z.url({
  protocol: /^https?$/,
  error: "Нужен адрес страницы по http или https",
});

export const analysisInputSchema = z.object({
  searchQuery: z.string().trim().min(1, "Запрос обязателен").max(500),
  primaryUrl: pageUrlSchema,
  competitorUrls: z
    .array(z.object({ url: pageUrlSchema }))
    .min(1, "Нужен хотя бы один конкурент")
    .max(5, "Больше пяти конкурентов не берём"),
});

export type AnalysisForm = z.infer<typeof analysisInputSchema>;

export type AnalysisInput = {
  searchQuery: string;
  primaryUrl: string;
  competitorUrls: string[];
};

export type AnalysisStatus = "queued" | "running" | "completed" | "failed";

export type AnalysisSummary = {
  id: string;
  searchQuery: string;
  status: AnalysisStatus;
  competitorCount: number;
  createdAt: string;
};

export type AnalysisFailure = {
  reason: "unreachable" | "empty" | "internal";
  url: string | null;
  detail: string | null;
};

export type ReportPage = { url: string; ours: boolean } & (
  | {
      status: "scored";
      title: string;
      fragmentCount: number;
      relevance: number;
      novelty: number | null;
      priority: number | null;
      recommendations: Recommendation[];
    }
  | { status: "failed"; reason: "unreachable" | "empty"; detail: string }
);

export type Recommendation = {
  rank: number;
  heading: string | null;
  text: string;
};

type AnalysisBase = {
  id: string;
  searchQuery: string;
  primaryUrl: string;
  competitorUrls: string[];
  createdAt: string;
};

export type QueuedAnalysis = AnalysisBase & { status: "queued" };
export type RunningAnalysis = AnalysisBase & {
  status: "running";
  progress: { done: number; total: number };
};
export type CompletedAnalysis = AnalysisBase & {
  status: "completed";
  model: string;
  pages: ReportPage[];
};
export type FailedAnalysis = AnalysisBase & {
  status: "failed";
  error: AnalysisFailure;
};

export type AnalysisRun =
  QueuedAnalysis | RunningAnalysis | CompletedAnalysis | FailedAnalysis;

export type AnalysisReceipt = { id: string; status: "queued" };
