export const analysisRunKeys = {
  all: ["analysis-runs"] as const,
  detail: (id: string) => ["analysis-runs", id] as const,
};
