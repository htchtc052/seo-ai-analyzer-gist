import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";

const MODEL = "Xenova/multilingual-e5-small";
const MODEL_DIR = ".models";
const BATCH_SIZE = 32;

env.cacheDir = MODEL_DIR;

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private extractor!: FeatureExtractionPipeline;

  get model(): string {
    return MODEL;
  }

  async onModuleInit(): Promise<void> {
    const started = Date.now();
    this.extractor = await pipeline("feature-extraction", MODEL, {
      dtype: "q8",
    });
    this.logger.log(`${MODEL} ready in ${Date.now() - started}ms`);
  }

  embedQuery(text: string): Promise<number[]> {
    return this.embed([`query: ${text}`]).then((vectors) => vectors[0]!);
  }

  embedPassages(texts: string[]): Promise<number[][]> {
    return this.embed(texts.map((text) => `passage: ${text}`));
  }

  private async embed(inputs: string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let at = 0; at < inputs.length; at += BATCH_SIZE) {
      const output = await this.extractor(inputs.slice(at, at + BATCH_SIZE), {
        pooling: "mean",
        normalize: true,
      });
      vectors.push(...(output.tolist() as number[][]));
    }
    return vectors;
  }
}
