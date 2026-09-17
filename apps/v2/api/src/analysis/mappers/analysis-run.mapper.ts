import { AnalysisStatus, PageSource, Prisma } from "@prisma/client";
import type {
  AnalysisFailure,
  AnalysisRun,
  AnalysisSummary,
  ReportSources,
} from "../dto/analysis.types.js";

export const runInclude = Prisma.validator<Prisma.AnalysisInclude>()({
  pages: {
    orderBy: [{ source: "asc" }, { position: "asc" }],
    include: {
      fragments: {
        orderBy: [{ sectionIndex: "asc" }, { paragraphIndex: "asc" }],
        select: {
          sectionIndex: true,
          paragraphIndex: true,
          heading: true,
          text: true,
          relevance: true,
          maxPrimarySimilarity: true,
          closestPrimaryFragment: {
            select: {
              sectionIndex: true,
              paragraphIndex: true,
              page: { select: { position: true } },
            },
          },
        },
      },
    },
  },
});

export const summarySelect = Prisma.validator<Prisma.AnalysisSelect>()({
  id: true,
  searchQuery: true,
  status: true,
  createdAt: true,
  _count: { select: { pages: true } },
});

type RunRecord = Prisma.AnalysisGetPayload<{ include: typeof runInclude }>;
type RunPage = RunRecord["pages"][number];
type RunFragment = RunPage["fragments"][number];
type SummaryRecord = Prisma.AnalysisGetPayload<{
  select: typeof summarySelect;
}>;

export function toAnalysisSummary(run: SummaryRecord): AnalysisSummary {
  return {
    id: run.id,
    searchQuery: run.searchQuery,
    status: run.status.toLowerCase() as AnalysisSummary["status"],
    pageCount: run._count.pages,
    createdAt: run.createdAt.toISOString(),
  };
}

export function toAnalysisRun(run: RunRecord): AnalysisRun {
  const base = {
    id: run.id,
    searchQuery: run.searchQuery,
    primarySiteUrl: run.primarySiteUrl,
    competitorSiteUrl: run.competitorSiteUrl,
    crawlPagesPerSite: run.crawlPagesPerSite,
    createdAt: run.createdAt.toISOString(),
  };
  const sources = toSources(run);

  if (run.status === AnalysisStatus.QUEUED)
    return { ...base, status: "queued" };
  if (run.status === AnalysisStatus.CRAWLING)
    return {
      ...base,
      status: "crawling",
      progress: { done: run.crawledPages, total: null },
    };
  if (run.status === AnalysisStatus.CRAWLED)
    return { ...base, status: "crawled", sources, progress: toEmbedded(run) };
  if (run.status === AnalysisStatus.ANALYZING)
    return { ...base, status: "analyzing", sources, progress: toEmbedded(run) };
  if (run.status === AnalysisStatus.FAILED)
    return {
      ...base,
      status: "failed",
      ...(run.pages.length > 0 ? { sources } : {}),
      error: toFailure(run),
    };

  return {
    ...base,
    status: "completed",
    sources,
    semantic: {
      model: run.embeddingModel!,
      primary: run.pages
        .filter((page) => page.source === PageSource.PRIMARY)
        .flatMap((page) =>
          page.fragments.map((fragment) => ({
            ref: toRef(page, fragment),
            relevance: fragment.relevance!,
          })),
        ),
      competitor: run.pages
        .filter((page) => page.source === PageSource.COMPETITOR)
        .flatMap((page) =>
          page.fragments.map((fragment) => ({
            ref: toRef(page, fragment),
            relevance: fragment.relevance!,
            maxPrimarySimilarity: fragment.maxPrimarySimilarity!,
            closestPrimaryRef: toClosestRef(fragment),
          })),
        ),
    },
  };
}

function toEmbedded(run: RunRecord) {
  return {
    done: run.pages.filter((page) => page.embeddedAt).length,
    total: run.pages.length,
  };
}

function toFailure(run: RunRecord): AnalysisFailure {
  const site =
    run.failureSite === PageSource.PRIMARY
      ? "primary"
      : run.failureSite === PageSource.COMPETITOR
        ? "competitor"
        : null;
  if (!site || !run.failureReason || !run.failureUrl || !run.failureDetail)
    return { site: null, reason: "internal" };
  return {
    site,
    reason: toReason(run.failureReason),
    url: run.failureUrl,
    detail: run.failureDetail,
  };
}

function toReason(reason: string): "unreachable" | "empty" {
  return reason === "EMPTY" ? "empty" : "unreachable";
}

function toSources(run: RunRecord): ReportSources {
  return {
    primary: toSource(run, PageSource.PRIMARY, run.primarySiteUrl),
    competitor: toSource(run, PageSource.COMPETITOR, run.competitorSiteUrl),
  };
}

function toSource(run: RunRecord, source: PageSource, startUrl: string) {
  return {
    startUrl,
    pages: run.pages
      .filter((page) => page.source === source)
      .map((page) => ({
        url: page.url,
        title: page.title,
        pageDate: page.pageDate?.toISOString() ?? null,
        pageDateSource: page.pageDateSource,
        sitemapLastmod: page.sitemapLastmod?.toISOString() ?? null,
        sections: toSections(page.fragments),
      })),
  };
}

function toSections(fragments: RunFragment[]) {
  const sections = new Map<
    number,
    { heading: string | null; paragraphs: string[] }
  >();
  for (const fragment of fragments) {
    const section = sections.get(fragment.sectionIndex) ?? {
      heading: fragment.heading,
      paragraphs: [],
    };
    section.paragraphs.push(fragment.text);
    sections.set(fragment.sectionIndex, section);
  }
  return [...sections.entries()]
    .toSorted(([left], [right]) => left - right)
    .map(([, section]) => section);
}

function toRef(page: RunPage, fragment: RunFragment) {
  return {
    pageIndex: page.position,
    sectionIndex: fragment.sectionIndex,
    paragraphIndex: fragment.paragraphIndex,
  };
}

function toClosestRef(fragment: RunFragment) {
  const closest = fragment.closestPrimaryFragment!;
  return {
    pageIndex: closest.page.position,
    sectionIndex: closest.sectionIndex,
    paragraphIndex: closest.paragraphIndex,
  };
}
