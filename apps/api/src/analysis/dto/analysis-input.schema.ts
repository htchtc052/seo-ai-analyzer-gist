import { z } from "zod";

const siteUrlSchema = z
  .url({ protocol: /^https?$/, error: "Enter an http or https URL" })
  .transform((value) => `${new URL(value).origin}/`);

export const analysisInputSchema = z.object({
  searchQuery: z.string().trim().min(1, "searchQuery is required").max(500),
  primarySiteUrl: siteUrlSchema,
  competitorSiteUrl: siteUrlSchema,
  crawlPagesPerSite: z.coerce.number().int().min(3).max(90),
});

export type AnalysisInputDto = z.infer<typeof analysisInputSchema>;
