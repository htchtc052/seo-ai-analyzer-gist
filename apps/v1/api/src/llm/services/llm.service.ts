import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { z, type ZodType } from "zod";
import type { AppConfig } from "../../config/config.schema.js";

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: OpenAI;
  private readonly embeddingModel: string;
  readonly chatModel: string | undefined;

  constructor(
    @Inject(ConfigService)
    config: ConfigService<AppConfig, true>,
  ) {
    this.client = new OpenAI({
      baseURL: config.get("LLM_BASE_URL", { infer: true }),
      apiKey: config.get("LLM_API_KEY", { infer: true }),
    });
    this.embeddingModel = config.get("LLM_EMBEDDING_MODEL", { infer: true });
    this.chatModel = config.get("LLM_CHAT_MODEL", { infer: true });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: texts,
    });
    this.logger.log(
      `${this.embeddingModel} tokens: ${response.usage.prompt_tokens}`,
    );
    return response.data.map((item) => item.embedding);
  }

  async completeStructured<T>(
    name: string,
    prompt: string,
    schema: ZodType<T>,
  ): Promise<T> {
    if (this.chatModel === undefined)
      throw new Error("LLM_CHAT_MODEL is not configured");
    const completion = await this.client.chat.completions.create({
      model: this.chatModel,
      messages: [{ role: "user", content: prompt }],
      reasoning_effort: "none",
      response_format: {
        type: "json_schema",
        json_schema: { name, strict: true, schema: z.toJSONSchema(schema) },
      },
    });
    this.logger.log(
      `${this.chatModel} tokens: prompt ${completion.usage?.prompt_tokens}, completion ${completion.usage?.completion_tokens}`,
    );
    const content = completion.choices[0]?.message.content;
    if (!content)
      throw new Error(
        `LLM returned no content (finish reason: ${completion.choices[0]?.finish_reason})`,
      );
    return schema.parse(JSON.parse(content));
  }
}
