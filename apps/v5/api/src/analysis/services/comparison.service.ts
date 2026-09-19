import { Injectable } from "@nestjs/common";

const SCORE_PRECISION = 1000;

@Injectable()
export class ComparisonService {
  relevance(query: number[], vectors: number[][]): number[] {
    return vectors.map((vector) => round(dot(query, vector)));
  }

  similarity(ours: number[][], theirs: number[][]): number[][] {
    return ours.map((our) => theirs.map((their) => round(dot(our, their))));
  }
}

function dot(left: number[], right: number[]): number {
  if (left.length !== right.length)
    throw new Error("Embedding vector dimensions do not match");
  return left.reduce((sum, value, index) => sum + value * right[index]!, 0);
}

function round(value: number): number {
  return Math.round(value * SCORE_PRECISION) / SCORE_PRECISION;
}
