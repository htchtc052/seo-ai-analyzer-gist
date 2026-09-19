export type Paragraph = {
  heading: string | null;
  text: string;
  relevance: number;
};

export type OurPage = {
  url: string;
  title: string;
  paragraphs: Paragraph[];
};

export type CompetitorPage = {
  url: string;
  domain: string;
  title: string;
  paragraphs: Paragraph[];
  similarity: number[][];
};

export type FailedPage = {
  url: string;
  reason: "unreachable" | "empty";
  detail: string;
};

export type ReadPage =
  | {
      url: string;
      ours: boolean;
      status: "loaded";
      title: string;
      paragraphs: Array<{ heading: string | null; text: string }>;
    }
  | ({ url: string; ours: boolean; status: "failed" } & Omit<
      FailedPage,
      "url"
    >);

export type AnalysisProgress = { done: number; total: number };

export type AnalysisReport = {
  model: string;
  ours: OurPage;
  competitors: CompetitorPage[];
  failed: FailedPage[];
};

export type AnalysisRun =
  | {
      id: string;
      query: string;
      status: "running";
      stage: "loading" | "embedding";
      progress: AnalysisProgress;
    }
  | ({ id: string; query: string; status: "completed" } & AnalysisReport)
  | { id: string; query: string; status: "failed"; detail: string };
