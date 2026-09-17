import { Inject, Injectable } from "@nestjs/common";
import type { ArticleSection } from "../../articles/dto/article.dto.js";
import type { FragmentScore } from "../dto/analysis-run.dto.js";
import { LlmService } from "../../llm/services/llm.service.js";

@Injectable()
export class RelevanceService {
  constructor(
    @Inject(LlmService)
    private readonly llm: LlmService,
  ) {}

  async score(query: string, sections: ArticleSection[]): Promise<number[]> {
    const texts = toFragments(sections).map((fragment) => fragment.text);
    const [queryEmbedding, ...embeddings] = await this.llm.embed([
      query,
      ...texts,
    ]);
    return embeddings.map((embedding) =>
      cosineSimilarity(queryEmbedding!, embedding),
    );
  }

  scoreFragments(
    sections: ArticleSection[],
    scores: number[],
  ): FragmentScore[] {
    return toFragments(sections).map((fragment, index) => ({
      ...fragment,
      score: scores[index]!,
    }));
  }

  overall(scores: number[]): number {
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
}

function toFragments(sections: ArticleSection[]) {
  return sections.flatMap((section) =>
    section.paragraphs.map((text) => ({ heading: section.heading, text })),
  );
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
