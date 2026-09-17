import { z } from "zod";

export const configSchema = z.object({
  API_HOST: z.string().min(1).default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  WEB_ORIGIN: z.url().default("http://localhost:5173"),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  LLM_BASE_URL: z.url(),
  LLM_API_KEY: z.string().trim().min(1),
  LLM_EMBEDDING_MODEL: z.string().trim().min(1),
  LLM_CHAT_MODEL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().min(1).optional(),
  ),
});

export type AppConfig = z.infer<typeof configSchema>;

export function validateConfig(input: Record<string, unknown>): AppConfig {
  const result = configSchema.safeParse(input);
  if (!result.success) {
    throw new Error(
      `Invalid application configuration:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
