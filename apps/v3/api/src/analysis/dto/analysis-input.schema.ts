import { z } from "zod";

const pageUrlSchema = z.url({
  protocol: /^https?$/,
  error: "Нужен адрес страницы по http или https",
});

// Вход задан заказчиком: запрос, наша страница и от одного до пяти
// конкурентов. Никакого домена и никакого обхода — только эти адреса.
export const analysisInputSchema = z.object({
  searchQuery: z.string().trim().min(1, "Запрос обязателен").max(500),
  primaryUrl: pageUrlSchema,
  competitorUrls: z
    .array(pageUrlSchema)
    .min(1, "Нужен хотя бы один конкурент")
    .max(5, "Больше пяти конкурентов не берём")
    .refine(
      (urls) => new Set(urls).size === urls.length,
      "Адреса конкурентов повторяются",
    ),
});

export type AnalysisInputDto = z.infer<typeof analysisInputSchema>;
