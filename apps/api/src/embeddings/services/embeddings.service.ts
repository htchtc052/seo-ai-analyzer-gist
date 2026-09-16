import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import type { AppConfig } from "../../config/config.schema.js";

const MAX_ATTEMPTS = 5;
const FINGERPRINT_LENGTH = 8;

class BrokenBatchError extends Error {}

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly client: OpenAI;
  readonly model: string;

  constructor(
    @Inject(ConfigService)
    config: ConfigService<AppConfig, true>,
  ) {
    this.client = new OpenAI({
      baseURL: config.get("LLM_BASE_URL", { infer: true }),
      apiKey: config.get("LLM_API_KEY", { infer: true }),
    });
    this.model = config.get("LLM_EMBEDDING_MODEL", { infer: true });
  }

  async embed(texts: string[]): Promise<number[][]> {
    let broken = "";
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const embeddings = await this.request(texts);
        this.logger.log(`${this.model}: ${embeddings.length} embeddings`);
        return embeddings;
      } catch (error) {
        if (!(error instanceof BrokenBatchError)) throw error;
        broken = error.message;
        this.logger.warn(`${this.model}: ${broken}, attempt ${attempt}`);
      }
    }
    throw new Error(
      `Embedding provider returned a broken batch ${MAX_ATTEMPTS} times: ${broken}`,
    );
  }

  private async request(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
      encoding_format: "float",
    });

    const embeddings: Array<number[] | undefined> = new Array(texts.length);
    for (const item of response.data) {
      if (
        !Number.isInteger(item.index) ||
        item.index < 0 ||
        item.index >= texts.length
      )
        throw new BrokenBatchError(`index ${item.index} is out of range`);
      if (embeddings[item.index])
        throw new BrokenBatchError(`index ${item.index} is repeated`);
      embeddings[item.index] = item.embedding;
    }

    const missing = embeddings.findIndex((embedding) => !embedding);
    if (missing !== -1)
      throw new BrokenBatchError(`index ${missing} is missing`);

    const shared = findSharedVector(texts, embeddings as number[][]);
    if (shared) throw new BrokenBatchError(shared);

    return embeddings as number[][];
  }
}

function findSharedVector(
  texts: string[],
  embeddings: number[][],
): string | null {
  const seen = new Map<string, number>();
  for (const [index, embedding] of embeddings.entries()) {
    const key = embedding.slice(0, FINGERPRINT_LENGTH).join(",");
    const first = seen.get(key);
    if (first === undefined) {
      seen.set(key, index);
      continue;
    }
    if (texts[first] !== texts[index])
      return `inputs ${first} and ${index} share one vector`;
  }
  return null;
}
