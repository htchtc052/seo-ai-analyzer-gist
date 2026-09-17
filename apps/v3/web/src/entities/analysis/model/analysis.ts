import { z } from "zod";

const pageUrlSchema = z.url({
  protocol: /^https?$/,
  error: "Нужен адрес страницы по http или https",
});

// Зеркало схемы бэкенда: запрос, наша страница и от одного до пяти
// конкурентов. Никаких доменов и обхода.
export const analysisInputSchema = z.object({
  searchQuery: z.string().trim().min(1, "Запрос обязателен").max(500),
  primaryUrl: pageUrlSchema,
  competitorUrls: z
    .array(z.object({ url: pageUrlSchema }))
    .min(1, "Нужен хотя бы один конкурент")
    .max(5, "Больше пяти конкурентов не берём"),
});

export type AnalysisForm = z.infer<typeof analysisInputSchema>;

export type AnalysisInput = {
  searchQuery: string;
  primaryUrl: string;
  competitorUrls: string[];
};

export type AnalysisStatus = "queued" | "running" | "completed" | "failed";

export type AnalysisSummary = {
  id: string;
  searchQuery: string;
  status: AnalysisStatus;
  competitorCount: number;
  createdAt: string;
};

export type AnalysisRun = AnalysisSummary & {
  primaryUrl: string;
  competitorUrls: string[];
};

export type AnalysisReceipt = { id: string; status: "queued" };
