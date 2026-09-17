export const analysisKeys = {
  all: ["analyses"] as const,
  detail: (id: string) => ["analyses", id] as const,
};
