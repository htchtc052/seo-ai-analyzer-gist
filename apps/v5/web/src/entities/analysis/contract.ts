import { z } from "zod";

const paragraphSchema = z.object({
  heading: z.string().nullable(),
  text: z.string(),
  relevance: z.number(),
});

const competitorSchema = z.object({
  url: z.string(),
  domain: z.string(),
  title: z.string(),
  paragraphs: z.array(paragraphSchema),
  similarity: z.array(z.array(z.number())),
});

export const analysisRunSchema = z.discriminatedUnion("status", [
  z.object({
    id: z.string(),
    query: z.string(),
    status: z.literal("running"),
    stage: z.enum(["loading", "embedding"]),
    progress: z.object({ done: z.number(), total: z.number() }),
  }),
  z.object({
    id: z.string(),
    query: z.string(),
    status: z.literal("completed"),
    model: z.string(),
    ours: z.object({
      url: z.string(),
      title: z.string(),
      paragraphs: z.array(paragraphSchema),
    }),
    competitors: z.array(competitorSchema),
    failed: z.array(
      z.object({
        url: z.string(),
        reason: z.enum(["unreachable", "empty"]),
        detail: z.string(),
      }),
    ),
  }),
  z.object({
    id: z.string(),
    query: z.string(),
    status: z.literal("failed"),
    detail: z.string(),
  }),
]);

export const analysisReceiptSchema = z.object({ id: z.string() });

export type AnalysisRun = z.infer<typeof analysisRunSchema>;
export type CompletedRun = Extract<AnalysisRun, { status: "completed" }>;
