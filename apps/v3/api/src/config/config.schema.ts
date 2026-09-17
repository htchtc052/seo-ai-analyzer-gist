import { z } from "zod";

export const configSchema = z.object({
  API_HOST: z.string().min(1),
  API_PORT: z.coerce.number().int().min(1).max(65_535),
  WEB_ORIGIN: z.url(),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  LLM_BASE_URL: z.url(),
  LLM_API_KEY: z.string().min(1),
  LLM_EMBEDDING_MODEL: z.string().min(1),
  GIST_URL: z.url({ protocol: /^https?$/ }),
});

export type AppConfig = z.infer<typeof configSchema>;

export function validateConfig(input: Record<string, unknown>): AppConfig {
  const result = configSchema.safeParse(input);
  if (!result.success)
    throw new Error(
      `Invalid application configuration:\n${z.prettifyError(result.error)}`,
    );
  return result.data;
}
