import { Inject, Injectable } from "@nestjs/common";
import { EmbeddingsService } from "../../embeddings/services/embeddings.service.js";
import type {
  EmbeddedFragment,
  FragmentComparison,
  SemanticFragmentInput,
} from "../dto/analysis.types.js";

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
    fragments: SemanticFragmentInput[],
  ): Promise<EmbeddedFragment[]> {
    const texts = [searchQuery, ...fragments.map(toDocumentInput)];
    const [queryEmbedding, ...fragmentEmbeddings] =
      await this.embeddings.embed(texts);
    if (!queryEmbedding) throw new Error("Query embedding is missing");
    if (fragmentEmbeddings.length !== fragments.length)
      throw new Error("Fragment and embedding counts do not match");

    const normalizedQuery = normalize(queryEmbedding);
    return fragments.map((fragment, index) => {
      const embedding = fragmentEmbeddings[index];
      if (!embedding) throw new Error("Fragment embedding is missing");
      const normalizedEmbedding = normalize(embedding);
      return {
        id: fragment.id,
        embedding: normalizedEmbedding,
        relevance: dot(normalizedQuery, normalizedEmbedding),
      };
    });
  }

  compare(
    primary: Array<{ id: string; embedding: number[] }>,
    competitor: Array<{ id: string; embedding: number[] }>,
  ): FragmentComparison[] {
    if (primary.length === 0)
      throw new Error("Primary website has no fragments");

    return competitor.map((fragment) => {
      let closest = primary[0]!;
      let similarity = dot(fragment.embedding, closest.embedding);
      for (const candidate of primary.slice(1)) {
        const candidateSimilarity = dot(
          fragment.embedding,
          candidate.embedding,
        );
        if (candidateSimilarity > similarity) {
          closest = candidate;
          similarity = candidateSimilarity;
        }
      }
      return {
        fragmentId: fragment.id,
        maxPrimarySimilarity: similarity,
        closestPrimaryFragmentId: closest.id,
      };
    });
  }
}

function toDocumentInput(fragment: SemanticFragmentInput): string {
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
