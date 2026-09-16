import type { CompletedAnalysis, SemanticReport } from "@/entities/analysis";

const TOP_FRAGMENTS = 5;

type FragmentScore = {
  relevance: number;
  similarity: number;
  score: number;
};

export type AnalysisPageRow = {
  id: string;
  domain: string;
  ours: boolean;
  title: string;
  url: string;
  score: number | undefined;
  bestScore: number | undefined;
  meanRelevance: number;
  coverage: number | undefined;
  fragmentCount: number;
};

export type AnalysisReport = {
  pages: AnalysisPageRow[];
  summary: {
    score: number;
    coverage: number;
    meanRelevance: number;
    meanPrimaryRelevance: number;
  };
};

export function buildAnalysisReport(run: CompletedAnalysis): AnalysisReport {
  const scoresByPage = new Map<number, FragmentScore[]>();
  for (const score of run.semantic.competitor) {
    const page = scoresByPage.get(score.ref.pageIndex) ?? [];
    page.push(toFragmentScore(score));
    scoresByPage.set(score.ref.pageIndex, page);
  }

  const competitorPages = run.sources.competitor.pages
    .map((page, pageIndex) => {
      const fragments = scoresByPage.get(pageIndex)!;
      return {
        id: page.url,
        domain: new URL(page.url).hostname,
        ours: false,
        title: page.title,
        url: page.url,
        score: total(fragments.map((fragment) => fragment.score)),
        bestScore: Math.max(...fragments.map((fragment) => fragment.score)),
        meanRelevance: mean(fragments.map((fragment) => fragment.relevance)),
        coverage: coverage(fragments),
        fragmentCount: fragments.length,
      };
    })
    .toSorted((left, right) => right.score - left.score);

  const primaryRelevance = new Map<number, number[]>();
  for (const score of run.semantic.primary) {
    const page = primaryRelevance.get(score.ref.pageIndex) ?? [];
    page.push(clamp(score.relevance));
    primaryRelevance.set(score.ref.pageIndex, page);
  }
  const primaryPages = run.sources.primary.pages
    .map((page, pageIndex) => {
      const relevance = primaryRelevance.get(pageIndex) ?? [];
      return {
        id: page.url,
        domain: new URL(page.url).hostname,
        ours: true,
        title: page.title,
        url: page.url,
        score: undefined,
        bestScore: undefined,
        meanRelevance: relevance.length === 0 ? 0 : mean(relevance),
        coverage: undefined,
        fragmentCount: relevance.length,
      };
    })
    .toSorted((left, right) => right.meanRelevance - left.meanRelevance);

  const fragments = [...scoresByPage.values()].flat();

  return {
    pages: [...competitorPages, ...primaryPages],
    summary: {
      score: mean(competitorPages.map((page) => page.score)),
      coverage: coverage(fragments),
      meanRelevance: mean(fragments.map((fragment) => fragment.relevance)),
      meanPrimaryRelevance: mean(
        run.semantic.primary.map((score) => clamp(score.relevance)),
      ),
    },
  };
}

function toFragmentScore(
  score: SemanticReport["competitor"][number],
): FragmentScore {
  const relevance = clamp(score.relevance);
  const similarity = clamp(score.maxPrimarySimilarity);
  return { relevance, similarity, score: relevance * (1 - similarity) };
}

function topScore(fragments: FragmentScore[]): number {
  return mean(
    fragments
      .map((fragment) => fragment.score)
      .toSorted((left, right) => right - left)
      .slice(0, TOP_FRAGMENTS),
  );
}

function coverage(fragments: FragmentScore[]): number {
  const relevance = total(fragments.map((fragment) => fragment.relevance));
  if (relevance === 0) return 0;
  return (
    total(
      fragments.map((fragment) => fragment.relevance * fragment.similarity),
    ) / relevance
  );
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function total(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

function mean(values: number[]): number {
  return total(values) / values.length;
}
