import { z } from "zod";

export const startAnalysisSchema = z.object({
  articleId: z.string().min(1, "Fetch the article first"),
  query: z
    .string()
    .trim()
    .min(1, "Enter a target query")
    .max(500, "Keep the query under 500 characters"),
  competitorIds: z.array(z.string()).max(2),
  audience: z.string().trim().max(1000, "Keep it under 1000 characters"),
  purpose: z.string().trim().max(1000, "Keep it under 1000 characters"),
  niche: z.string().trim().max(1000, "Keep it under 1000 characters"),
});

export type StartAnalysisDto = z.infer<typeof startAnalysisSchema>;
