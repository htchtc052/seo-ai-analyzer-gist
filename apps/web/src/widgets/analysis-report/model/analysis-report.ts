import type { CompletedAnalysis, SemanticReport } from "@/entities/analysis";

type FragmentScore = {
  relevance: number;
  similarity: number;
};

export type AnalysisPageRow = {
  id: string;
  domain: string;
  ours: boolean;
  title: string;
  url: string;
  priority: number | undefined;
  novelty: number | undefined;
  relevance: number;
  bestFragment: number | undefined;
  fragmentCount: number;
};

export type AnalysisDomainRow = {
  domain: string;
  ours: boolean;
  pageCount: number;
  fragmentCount: number;
  relevance: number;
  novelty: number | undefined;
};

export type AnalysisReport = {
  domains: AnalysisDomainRow[];
  pages: AnalysisPageRow[];
};

export function buildAnalysisReport(run: CompletedAnalysis): AnalysisReport {
  const competitorByPage = groupByPage(
    run.semantic.competitor,
    toFragmentScore,
  );
  const primaryByPage = groupByPage(run.semantic.primary, toFragmentScore);

  const competitorPages = run.sources.competitor.pages
    .map((page, pageIndex) => {
      const fragments = competitorByPage.get(pageIndex) ?? [];
      const relevance = meanRelevance(fragments);
      const pageNovelty = novelty(fragments);
      return {
        id: page.url,
        domain: new URL(page.url).hostname,
        ours: false,
        title: page.title,
        url: page.url,
        priority: relevance * pageNovelty,
        novelty: pageNovelty,
        relevance,
        bestFragment: Math.max(...fragments.map(fragmentScore), 0),
        fragmentCount: fragments.length,
      };
    })
    .toSorted((left, right) => right.priority - left.priority);

  const primaryPages = run.sources.primary.pages
    .map((page, pageIndex) => {
      const fragments = primaryByPage.get(pageIndex) ?? [];
      return {
        id: page.url,
        domain: new URL(page.url).hostname,
        ours: true,
        title: page.title,
        url: page.url,
        priority: undefined,
        novelty: undefined,
        relevance: meanRelevance(fragments),
        bestFragment: undefined,
        fragmentCount: fragments.length,
      };
    })
    .toSorted((left, right) => right.relevance - left.relevance);

  const competitorFragments = [...competitorByPage.values()].flat();
  const primaryFragments = [...primaryByPage.values()].flat();

  return {
    domains: [
      {
        domain: new URL(run.competitorSiteUrl).hostname,
        ours: false,
        pageCount: competitorPages.length,
        fragmentCount: competitorFragments.length,
        relevance: meanRelevance(competitorFragments),
        novelty: novelty(competitorFragments),
      },
      {
        domain: new URL(run.primarySiteUrl).hostname,
        ours: true,
        pageCount: primaryPages.length,
        fragmentCount: primaryFragments.length,
        relevance: meanRelevance(primaryFragments),
        novelty: undefined,
      },
    ],
    pages: [...competitorPages, ...primaryPages],
  };
}

function groupByPage<T extends { ref: { pageIndex: number } }, R>(
  scores: T[],
  map: (score: T) => R,
): Map<number, R[]> {
  const grouped = new Map<number, R[]>();
  for (const score of scores) {
    const page = grouped.get(score.ref.pageIndex) ?? [];
    page.push(map(score));
    grouped.set(score.ref.pageIndex, page);
  }
  return grouped;
}

function toFragmentScore(
  score:
    SemanticReport["competitor"][number] | SemanticReport["primary"][number],
): FragmentScore {
  return {
    relevance: clamp(score.relevance),
    similarity:
      "maxPrimarySimilarity" in score ? clamp(score.maxPrimarySimilarity) : 0,
  };
}

function fragmentScore(fragment: FragmentScore): number {
  return fragment.relevance * (1 - fragment.similarity);
}

function meanRelevance(fragments: FragmentScore[]): number {
  if (fragments.length === 0) return 0;
  return (
    total(fragments.map((fragment) => fragment.relevance)) / fragments.length
  );
}

function novelty(fragments: FragmentScore[]): number {
  const weight = total(fragments.map((fragment) => fragment.relevance));
  if (weight === 0) return 0;
  return total(fragments.map(fragmentScore)) / weight;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function total(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}
