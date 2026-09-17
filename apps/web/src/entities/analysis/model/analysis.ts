import { z } from "zod";

const siteUrlSchema = z
  .string()
  .trim()
  .pipe(
    z.url({
      protocol: /^https?$/,
      error: "Введите полный URL с http или https",
    }),
  );

export const analysisInputSchema = z.object({
  searchQuery: z
    .string()
    .trim()
    .min(1, "Введите поисковый запрос")
    .max(500, "Запрос должен быть короче 500 символов"),
  primarySiteUrl: siteUrlSchema,
  competitorSiteUrl: siteUrlSchema,
  crawlPagesPerSite: z
    .number()
    .int("Введите целое число")
    .min(5, "Минимум 5 страниц")
    .max(90, "Максимум 90 страниц"),
});

export const analysisReceiptSchema = z.object({
  id: z.uuid(),
  status: z.literal("queued"),
});

const sectionSchema = z.object({
  heading: z.string().nullable(),
  paragraphs: z.array(z.string()),
});

const crawledPageSchema = z.object({
  url: siteUrlSchema,
  title: z.string(),
  sections: z.array(sectionSchema),
});

const crawledSiteSchema = z.object({
  startUrl: siteUrlSchema,
  pages: z.array(crawledPageSchema),
});

const crawledSourcesSchema = z.object({
  primary: crawledSiteSchema,
  competitor: crawledSiteSchema,
});

const fragmentRefSchema = z.object({
  pageIndex: z.number().int().nonnegative(),
  sectionIndex: z.number().int().nonnegative(),
  paragraphIndex: z.number().int().nonnegative(),
});

const semanticReportSchema = z.object({
  model: z.string(),
  primary: z.array(z.object({ ref: fragmentRefSchema, relevance: z.number() })),
  competitor: z.array(
    z.object({
      ref: fragmentRefSchema,
      relevance: z.number(),
      maxPrimarySimilarity: z.number(),
      closestPrimaryRef: fragmentRefSchema,
    }),
  ),
});

const progressSchema = z.object({
  done: z.number().int().nonnegative(),
  total: z.number().int().nonnegative().nullable(),
});

const analysisRunBaseSchema = analysisInputSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
});

export const analysisRunSchema = z.discriminatedUnion("status", [
  analysisRunBaseSchema.extend({ status: z.literal("queued") }),
  analysisRunBaseSchema.extend({
    status: z.literal("crawling"),
    progress: progressSchema,
  }),
  analysisRunBaseSchema.extend({
    status: z.literal("crawled"),
    sources: crawledSourcesSchema,
    progress: progressSchema,
  }),
  analysisRunBaseSchema.extend({
    status: z.literal("analyzing"),
    sources: crawledSourcesSchema,
    progress: progressSchema,
  }),
  analysisRunBaseSchema.extend({
    status: z.literal("completed"),
    sources: crawledSourcesSchema,
    semantic: semanticReportSchema,
  }),
  analysisRunBaseSchema.extend({
    status: z.literal("failed"),
    sources: crawledSourcesSchema.optional(),
    error: z.union([
      z.object({
        site: z.enum(["primary", "competitor"]),
        reason: z.enum(["unreachable", "empty"]),
        url: z.string(),
        detail: z.string(),
      }),
      z.object({ site: z.null(), reason: z.literal("internal") }),
    ]),
  }),
]);

export const analysisSummarySchema = z.object({
  id: z.uuid(),
  searchQuery: z.string(),
  status: z.enum([
    "queued",
    "crawling",
    "crawled",
    "analyzing",
    "completed",
    "failed",
  ]),
  pageCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
});

export const analysisListSchema = z.array(analysisSummarySchema);

export type AnalysisInput = z.infer<typeof analysisInputSchema>;
export type AnalysisReceipt = z.infer<typeof analysisReceiptSchema>;
export type AnalysisRun = z.infer<typeof analysisRunSchema>;
export type AnalysisSummary = z.infer<typeof analysisSummarySchema>;
export type RunProgress = z.infer<typeof progressSchema>;
export type CompletedAnalysis = Extract<AnalysisRun, { status: "completed" }>;
export type FailedAnalysis = Extract<AnalysisRun, { status: "failed" }>;
export type CrawledSite = z.infer<typeof crawledSiteSchema>;
export type FragmentRef = z.infer<typeof fragmentRefSchema>;
export type SemanticReport = z.infer<typeof semanticReportSchema>;
