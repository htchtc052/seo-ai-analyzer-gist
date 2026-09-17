import { z } from "zod";

export const articleSectionSchema = z.object({
  heading: z.string().min(1).nullable(),
  paragraphs: z.array(z.string().min(1)).min(1),
});

export const articleSchema = z.object({
  id: z.string().min(1),
  sourceUrl: z.url(),
  title: z.string().min(1),
  sections: z.array(articleSectionSchema).min(1),
  importedAt: z.iso.datetime(),
});

export const articleResponseSchema = z.object({ article: articleSchema });

export const importArticleSchema = z.object({
  url: z.url({
    protocol: /^https?$/,
    error: "url must be an http or https URL",
  }),
});

export type ArticleSection = z.infer<typeof articleSectionSchema>;
export type Article = z.infer<typeof articleSchema>;
export type ImportArticleDto = z.infer<typeof importArticleSchema>;
