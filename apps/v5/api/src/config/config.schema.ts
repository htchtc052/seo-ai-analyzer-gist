import { z } from "zod";

export const configSchema = z.object({
  API_HOST: z.string().min(1).default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3005),
  WEB_ORIGIN: z.url().default("http://localhost:5177"),
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
