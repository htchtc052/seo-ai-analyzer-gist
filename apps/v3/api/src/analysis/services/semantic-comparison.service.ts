import { Inject, Injectable } from "@nestjs/common";
import { EmbeddingsService } from "../../embeddings/services/embeddings.service.js";
import type { EmbeddedFragment, FragmentInput } from "../dto/analysis.types.js";

@Injectable()
export class SemanticComparisonService {
  constructor(
    @Inject(EmbeddingsService)
    private readonly embeddings: EmbeddingsService,
  ) {}

  get model(): string {
    return this.embeddings.model;
  }

  async embedPage(
    searchQuery: string,
    fragments: FragmentInput[],
  ): Promise<EmbeddedFragment[]> {
    const texts = [searchQuery, ...fragments.map(toDocumentInput)];
    const [queryEmbedding, ...fragmentEmbeddings] =
      await this.embeddings.embed(texts);
    if (!queryEmbedding) throw new Error("Query embedding is missing");
    if (fragmentEmbeddings.length !== fragments.length)
      throw new Error("Fragment and embedding counts do not match");

    const query = normalize(queryEmbedding);
    return fragments.map((fragment, index) => {
      const embedding = fragmentEmbeddings[index];
      if (!embedding) throw new Error("Fragment embedding is missing");
      const unit = normalize(embedding);
      return { ...fragment, embedding: unit, relevance: dot(query, unit) };
    });
  }

  similarities(
    ours: Array<{ embedding: number[] }>,
    theirs: Array<{ id: string; embedding: number[] }>,
  ): Array<{ id: string; similarity: number }> {
    if (ours.length === 0) throw new Error("Our page has no fragments");
    return theirs.map((fragment) => ({
      id: fragment.id,
      similarity: Math.max(
        ...ours.map((mine) => dot(fragment.embedding, mine.embedding)),
      ),
    }));
  }
}

function toDocumentInput(fragment: FragmentInput): string {
  return fragment.heading
    ? `${fragment.heading}\n${fragment.text}`
    : fragment.text;
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(
    vector.reduce((sum, component) => sum + component * component, 0),
  );
  if (magnitude === 0) throw new Error("Embedding vector has zero magnitude");
  return vector.map((component) => component / magnitude);
}

function dot(left: number[], right: number[]): number {
  if (left.length !== right.length)
    throw new Error("Embedding vector dimensions do not match");
  return left.reduce(
    (sum, component, index) => sum + component * right[index]!,
    0,
  );
}
