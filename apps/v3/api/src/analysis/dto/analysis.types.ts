export type AnalysisReceipt = {
  id: string;
  status: "queued";
};

export type AnalysisSummary = {
  id: string;
  searchQuery: string;
  status: "queued" | "running" | "completed" | "failed";
  competitorCount: number;
  createdAt: string;
};

export type AnalysisRun = AnalysisSummary & {
  primaryUrl: string;
  competitorUrls: string[];
};
