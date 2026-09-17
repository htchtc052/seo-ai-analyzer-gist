import { z } from "zod";
import { articleSchema } from "../../articles/dto/article.dto.js";

const articleRefSchema = articleSchema.pick({
  id: true,
  sourceUrl: true,
  title: true,
});

export const startAnalysisSchema = z.object({
  articleId: z.string().trim().min(1, "articleId is required"),
  query: z.string().trim().min(1, "query is required").max(500),
  competitorIds: z
    .array(z.string().min(1))
    .max(2)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "competitorIds must be unique",
    ),
  audience: z.string().trim().max(1000),
  purpose: z.string().trim().max(1000),
  niche: z.string().trim().max(1000),
});

export const fragmentScoreSchema = z.object({
  heading: z.string().min(1).nullable(),
  text: z.string().min(1),
  score: z.number().min(-1).max(1),
});

export const recommendationJobSchema = z.object({
  state: z.enum([
    "waiting",
    "waiting-children",
    "prioritized",
    "delayed",
    "active",
    "completed",
    "failed",
    "unknown",
  ]),
  failedReason: z.string().nullable(),
});

export const analysisRunSummarySchema = z.object({
  id: z.string().min(1),
  article: articleRefSchema,
  query: z.string(),
  overallScore: z.number().min(-1).max(1),
  competitorCount: z.number().int().min(0),
  recommendations: z.array(z.string()),
  recommendationJob: recommendationJobSchema.nullable(),
  createdAt: z.iso.datetime(),
});

export const analysisRunSchema = analysisRunSummarySchema
  .omit({ competitorCount: true })
  .extend({
    competitors: z.array(articleRefSchema),
    audience: z.string(),
    purpose: z.string(),
    niche: z.string(),
    fragments: z.array(fragmentScoreSchema).min(1),
    missingEntities: z.array(z.string()),
  });

export const analysisRunResponseSchema = z.object({ run: analysisRunSchema });
export const analysisRunListSchema = z.object({
  runs: z.array(analysisRunSummarySchema),
});
export const featuresResponseSchema = z.object({
  features: z.object({ recommendations: z.boolean() }),
});

export type StartAnalysisDto = z.infer<typeof startAnalysisSchema>;
export type FragmentScore = z.infer<typeof fragmentScoreSchema>;
export type RecommendationJob = z.infer<typeof recommendationJobSchema>;
export type AnalysisRunSummary = z.infer<typeof analysisRunSummarySchema>;
export type AnalysisRun = z.infer<typeof analysisRunSchema>;
export type Features = z.infer<typeof featuresResponseSchema>["features"];
