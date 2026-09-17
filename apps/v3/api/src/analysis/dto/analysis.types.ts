export type AnalysisStatusDto = "queued" | "running" | "completed" | "failed";

export type AnalysisReceipt = { id: string; status: "queued" };

export type AnalysisSummary = {
  id: string;
  searchQuery: string;
  status: AnalysisStatusDto;
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
  heading: string | null;
  text: string;
  gap: number;
};

export type SelectionScores = {
  objective: number;
  utility: number;
  diversity: number;
};

type AnalysisBase = {
  id: string;
  searchQuery: string;
  primaryUrl: string;
  competitorUrls: string[];
  createdAt: string;
};

export type AnalysisRun =
  | (AnalysisBase & { status: "queued" })
  | (AnalysisBase & {
      status: "running";
      progress: { done: number; total: number };
    })
  | (AnalysisBase & {
      status: "completed";
      model: string;
      pages: ReportPage[];
      selection: SelectionScores;
    })
  | (AnalysisBase & { status: "failed"; error: AnalysisFailure });

export type FragmentInput = {
  sectionIndex: number;
  paragraphIndex: number;
  heading: string | null;
  text: string;
};

export type EmbeddedFragment = FragmentInput & {
  embedding: number[];
  relevance: number;
};
