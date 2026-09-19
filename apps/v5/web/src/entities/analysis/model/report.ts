import type { CompletedRun } from "../contract";

export type Idea = {
  competitorIndex: number;
  paragraph: CompetitorParagraph;
};

export type OurParagraph = CompletedRun["ours"]["paragraphs"][number] & {
  index: number;
  match: {
    competitorIndex: number;
    paragraphIndex: number;
    similarity: number;
  };
};

export type CompetitorParagraph =
  CompletedRun["competitors"][number]["paragraphs"][number] & {
    index: number;
    match: {
      oursIndex: number;
      similarity: number;
    };
  };

export type SourceGroup = {
  domain: string;
  url: string;
  title: string;
  paragraphs: CompetitorParagraph[];
  averageRelevance: number;
};

export type AnalysisReport = {
  ours: {
    url: string;
    title: string;
    paragraphs: OurParagraph[];
    averageRelevance: number;
  };
  competitors: SourceGroup[];
  failed: CompletedRun["failed"];
  bestSimilarities: number[];
  defaultNewnessThreshold: number;
};

export function createAnalysisReport(run: CompletedRun): AnalysisReport {
  const ourMatches = run.ours.paragraphs.map(() => ({
    competitorIndex: 0,
    paragraphIndex: 0,
    similarity: -Infinity,
  }));
  const competitorMatches = run.competitors.map((competitor) =>
    competitor.paragraphs.map(() => ({ oursIndex: 0, similarity: -Infinity })),
  );

  run.competitors.forEach((competitor, competitorIndex) => {
    competitor.similarity.forEach((row, oursIndex) => {
      row.forEach((similarity, paragraphIndex) => {
        if (similarity > ourMatches[oursIndex]!.similarity) {
          ourMatches[oursIndex] = {
            competitorIndex,
            paragraphIndex,
            similarity,
          };
        }
        if (
          similarity >
          competitorMatches[competitorIndex]![paragraphIndex]!.similarity
        ) {
          competitorMatches[competitorIndex]![paragraphIndex] = {
            oursIndex,
            similarity,
          };
        }
      });
    });
  });

  const ours = {
    url: run.ours.url,
    title: run.ours.title,
    paragraphs: run.ours.paragraphs.map((paragraph, index) => ({
      ...paragraph,
      index,
      match: ourMatches[index]!,
    })),
    averageRelevance: average(
      run.ours.paragraphs.map((paragraph) => paragraph.relevance),
    ),
  };
  const competitors = run.competitors.map((competitor, competitorIndex) => ({
    domain: competitor.domain,
    url: competitor.url,
    title: competitor.title,
    paragraphs: competitor.paragraphs.map((paragraph, index) => ({
      ...paragraph,
      index,
      match: competitorMatches[competitorIndex]![index]!,
    })),
    averageRelevance: average(
      competitor.paragraphs.map((paragraph) => paragraph.relevance),
    ),
  }));
  const bestSimilarities = [
    ...ours.paragraphs.map((paragraph) => paragraph.match.similarity),
    ...competitors.flatMap((competitor) =>
      competitor.paragraphs.map((paragraph) => paragraph.match.similarity),
    ),
  ];

  return {
    ours,
    competitors,
    failed: run.failed,
    bestSimilarities,
    defaultNewnessThreshold: newness(median(bestSimilarities)),
  };
}

export function selectIdeas(
  report: AnalysisReport,
  minimumNewness: number,
): Idea[] {
  return report.competitors
    .flatMap((competitor, competitorIndex) =>
      competitor.paragraphs.map((paragraph) => ({
        competitorIndex,
        paragraph,
      })),
    )
    .filter(
      ({ paragraph }) =>
        paragraph.relevance > report.ours.averageRelevance &&
        newness(paragraph.match.similarity) >= minimumNewness,
    )
    .toSorted(
      (left, right) =>
        right.paragraph.relevance - left.paragraph.relevance ||
        left.paragraph.match.similarity - right.paragraph.match.similarity,
    );
}

export function newnessChoices(report: AnalysisReport): number[] {
  const sorted = report.bestSimilarities.toSorted((left, right) => right - left);
  return [
    newness(sorted[Math.round((sorted.length - 1) * 0.1)]!),
    newness(sorted[Math.round((sorted.length - 1) * 0.25)]!),
    newness(sorted[Math.round((sorted.length - 1) * 0.4)]!),
    report.defaultNewnessThreshold,
    newness(sorted[Math.round((sorted.length - 1) * 0.6)]!),
    newness(sorted[Math.round((sorted.length - 1) * 0.75)]!),
    newness(sorted[Math.round((sorted.length - 1) * 0.9)]!),
  ];
}

export function newness(similarity: number) {
  return 1 - similarity;
}

export function compareWithMedian(value: number, values: number[]) {
  const baseline = median(values);
  const difference = value - baseline;

  return {
    baseline,
    relativeDifference: Math.abs(difference / baseline),
    relation: difference > 0 ? "above" : difference < 0 ? "below" : "equal",
  } as const;
}

function average(numbers: number[]) {
  return numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
}

function median(numbers: number[]) {
  const sorted = numbers.toSorted((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}
