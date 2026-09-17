import { z } from "zod";

export const recommendationSchema = z.object({
  missingEntities: z.array(z.string().min(1)),
  recommendations: z.array(z.string().min(1)).min(1),
});

export type Recommendation = z.infer<typeof recommendationSchema>;
