import { Inject, Injectable } from "@nestjs/common";
import {
  AnalysisStatus,
  FailureReason,
  FailureSite,
  PageSource,
} from "@prisma/client";
import { PrismaService } from "../../prisma/services/prisma.service.js";
import type { AnalysisInputDto } from "../dto/analysis-input.schema.js";
import type {
  AnalysisFailure,
  AnalysisRun,
  AnalysisSummary,
  CrawledSite,
  CrawledSources,
  EmbeddedFragment,
  FragmentComparison,
} from "../dto/analysis.types.js";
import {
  runInclude,
  summarySelect,
  toAnalysisRun,
  toAnalysisSummary,
} from "../mappers/analysis-run.mapper.js";

@Injectable()
export class AnalysisRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async create(input: AnalysisInputDto): Promise<string> {
    const run = await this.prisma.analysis.create({
      data: input,
      select: { id: true },
    });
    return run.id;
  }

  async findById(id: string): Promise<AnalysisRun | null> {
    const run = await this.prisma.analysis.findUnique({
      where: { id },
      include: runInclude,
    });
    return run ? toAnalysisRun(run) : null;
  }

  async list(): Promise<AnalysisSummary[]> {
    const runs = await this.prisma.analysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: summarySelect,
    });
    return runs.map(toAnalysisSummary);
  }

  findCrawlInput(id: string) {
    return this.prisma.analysis.findUniqueOrThrow({
      where: { id },
      select: {
        searchQuery: true,
        primarySiteUrl: true,
        competitorSiteUrl: true,
        crawlPagesPerSite: true,
      },
    });
  }

  markCrawling(id: string) {
    return this.prisma.analysis.update({
      where: { id },
      data: {
        status: AnalysisStatus.CRAWLING,
        crawledPages: 0,
        failureSite: null,
        failureReason: null,
        failureUrl: null,
        failureDetail: null,
      },
    });
  }

  saveCrawled(id: string, sources: CrawledSources) {
    return this.prisma.analysis.update({
      where: { id },
      data: {
        status: AnalysisStatus.CRAWLED,
        pages: {
          deleteMany: {},
          create: [
            ...toPageCreates(sources.primary, PageSource.PRIMARY),
            ...toPageCreates(sources.competitor, PageSource.COMPETITOR),
          ],
        },
      },
    });
  }

  async markAnalyzing(id: string): Promise<string[]> {
    await this.prisma.analysis.update({
      where: { id },
      data: { status: AnalysisStatus.ANALYZING },
    });
    const pages = await this.prisma.analysisPage.findMany({
      where: { analysisId: id },
      orderBy: [{ source: "asc" }, { position: "asc" }],
      select: { id: true },
    });
    return pages.map((page) => page.id);
  }

  async findPageForEmbedding(pageId: string) {
    const page = await this.prisma.analysisPage.findUnique({
      where: { id: pageId },
      include: {
        analysis: { select: { id: true, searchQuery: true, status: true } },
        fragments: {
          orderBy: [{ sectionIndex: "asc" }, { paragraphIndex: "asc" }],
        },
      },
    });
    if (!page) return null;
    return {
      id: page.id,
      embeddedAt: page.embeddedAt,
      fragments: page.fragments,
      analysisId: page.analysis.id,
      searchQuery: page.analysis.searchQuery,
      failed: page.analysis.status === AnalysisStatus.FAILED,
    };
  }

  async savePageEmbeddings(
    pageId: string,
    fragments: EmbeddedFragment[],
  ): Promise<number> {
    await this.prisma.$transaction([
      ...fragments.map((fragment) =>
        this.prisma.fragment.update({
          where: { id: fragment.id },
          data: {
            embedding: fragment.embedding,
            relevance: fragment.relevance,
          },
        }),
      ),
      this.prisma.analysisPage.update({
        where: { id: pageId },
        data: { embeddedAt: new Date() },
      }),
    ]);

    const page = await this.prisma.analysisPage.findUniqueOrThrow({
      where: { id: pageId },
      select: { analysisId: true },
    });
    return this.prisma.analysisPage.count({
      where: { analysisId: page.analysisId, embeddedAt: null },
    });
  }

  countCrawledPage(id: string) {
    return this.prisma.analysis.update({
      where: { id },
      data: { crawledPages: { increment: 1 } },
    });
  }

  async findVectors(id: string) {
    const pages = await this.prisma.analysisPage.findMany({
      where: { analysisId: id },
      select: {
        source: true,
        fragments: { select: { id: true, embedding: true } },
      },
    });
    return {
      primary: pages
        .filter((page) => page.source === PageSource.PRIMARY)
        .flatMap((page) => page.fragments),
      competitor: pages
        .filter((page) => page.source === PageSource.COMPETITOR)
        .flatMap((page) => page.fragments),
    };
  }

  countPendingPages(analysisId: string): Promise<number> {
    return this.prisma.analysisPage.count({
      where: { analysisId, embeddedAt: null },
    });
  }

  async complete(
    id: string,
    model: string,
    comparisons: FragmentComparison[],
  ): Promise<void> {
    await this.prisma.$transaction([
      ...comparisons.map((comparison) =>
        this.prisma.fragment.update({
          where: { id: comparison.fragmentId },
          data: {
            maxPrimarySimilarity: comparison.maxPrimarySimilarity,
            closestPrimaryFragmentId: comparison.closestPrimaryFragmentId,
          },
        }),
      ),
      this.prisma.analysis.update({
        where: { id },
        data: {
          status: AnalysisStatus.COMPLETED,
          embeddingModel: model,
          completedAt: new Date(),
          failureSite: null,
          failureReason: null,
          failureUrl: null,
          failureDetail: null,
        },
      }),
    ]);
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.prisma.analysis.deleteMany({ where: { id } });
    return count > 0;
  }

  fail(id: string, failure: AnalysisFailure) {
    return this.prisma.analysis.update({
      where: { id },
      data: {
        status: AnalysisStatus.FAILED,
        failureSite: failure.site
          ? (failure.site.toUpperCase() as FailureSite)
          : null,
        failureReason: failure.reason.toUpperCase() as FailureReason,
        failureUrl: failure.site ? failure.url : null,
        failureDetail: failure.site ? failure.detail : null,
      },
    });
  }
}

function toPageCreates(site: CrawledSite, source: PageSource) {
  return site.pages.map((page, position) => ({
    source,
    position,
    url: page.url,
    title: page.title,
    fragments: {
      create: page.sections.flatMap((section, sectionIndex) =>
        section.paragraphs.map((text, paragraphIndex) => ({
          sectionIndex,
          paragraphIndex,
          heading: section.heading,
          text,
        })),
      ),
    },
  }));
}
