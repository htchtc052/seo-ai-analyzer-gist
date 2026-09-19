import { z } from "zod";

export const analysisInputSchema = z.object({
  query: z.string().trim().min(1).max(500),
  url: z.url(),
  competitorUrls: z.array(z.url()).min(1).max(4),
});

export type AnalysisInputDto = z.infer<typeof analysisInputSchema>;
