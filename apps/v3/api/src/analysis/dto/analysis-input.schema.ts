import { z } from "zod";

const pageUrlSchema = z.url({
  protocol: /^https?$/,
  error: "Enter an http or https page URL",
});

export const analysisInputSchema = z.object({
  searchQuery: z.string().trim().min(1, "searchQuery is required").max(500),
  primaryUrl: pageUrlSchema,
  competitorUrls: z
    .array(pageUrlSchema)
    .min(1, "At least one competitor URL is required")
    .max(5, "At most five competitor URLs are allowed")
    .refine(
      (urls) => new Set(urls).size === urls.length,
      "competitorUrls must be unique",
    ),
});

export type AnalysisInputDto = z.infer<typeof analysisInputSchema>;
