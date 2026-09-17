import { Inject, Injectable } from "@nestjs/common";
import { AnalysisStatus, FailureReason, PageSource } from "@prisma/client";
import { PrismaService } from "../../prisma/services/prisma.service.js";
import type { AnalysisInputDto } from "../dto/analysis-input.schema.js";
import type {
  AnalysisRun,
  AnalysisSummary,
  EmbeddedFragment,
} from "../dto/analysis.types.js";
import {
  runInclude,
  summarySelect,
  toAnalysisRun,
  toAnalysisSummary,
} from "../mappers/analysis.mapper.js";

@Injectable()
export class AnalysisRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async create(
    input: AnalysisInputDto,
  ): Promise<{ id: string; pageIds: string[] }> {
    const run = await this.prisma.analysis.create({
      data: {
        searchQuery: input.searchQuery,
        pages: {
          create: [
            { source: PageSource.PRIMARY, position: 0, url: input.primaryUrl },
            ...input.competitorUrls.map((url, position) => ({
              source: PageSource.COMPETITOR,
              position,
              url,
            })),
          ],
        },
      },
      select: { id: true, pages: { select: { id: true } } },
    });
    return { id: run.id, pageIds: run.pages.map((page) => page.id) };
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

  async delete(id: string): Promise<boolean> {
    const { count } = await this.prisma.analysis.deleteMany({ where: { id } });
    return count > 0;
  }

  async markRunning(id: string): Promise<void> {
    await this.prisma.analysis.updateMany({
      where: { id, status: AnalysisStatus.QUEUED },
      data: { status: AnalysisStatus.RUNNING },
    });
  }

  findPage(pageId: string) {
    return this.prisma.analysisPage.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        url: true,
        source: true,
        analysisId: true,
        embeddedAt: true,
        analysis: { select: { searchQuery: true } },
      },
    });
  }

  async savePage(
    pageId: string,
    title: string,
    fragments: EmbeddedFragment[],
  ): Promise<number> {
    const page = await this.prisma.analysisPage.update({
      where: { id: pageId },
      data: {
        title,
        embeddedAt: new Date(),
        fragments: {
          deleteMany: {},
          create: fragments.map((fragment) => ({
            sectionIndex: fragment.sectionIndex,
            paragraphIndex: fragment.paragraphIndex,
            heading: fragment.heading,
            text: fragment.text,
            embedding: fragment.embedding,
            relevance: fragment.relevance,
          })),
        },
      },
      select: { analysisId: true },
    });
    return this.countPendingPages(page.analysisId);
  }

  countPendingPages(analysisId: string): Promise<number> {
    return this.prisma.analysisPage.count({
      where: { analysisId, embeddedAt: null, failureReason: null },
    });
  }

  async failPage(
    pageId: string,
    failure: { reason: FailureReason; detail: string },
  ): Promise<number> {
    const page = await this.prisma.analysisPage.update({
      where: { id: pageId },
      data: { failureReason: failure.reason, failureDetail: failure.detail },
      select: { analysisId: true },
    });
    return this.countPendingPages(page.analysisId);
  }

  async findVectors(analysisId: string) {
    const pages = await this.prisma.analysisPage.findMany({
      where: { analysisId },
      select: {
        source: true,
        fragments: { select: { id: true, embedding: true } },
      },
    });
    const bySource = (source: PageSource) =>
      pages
        .filter((page) => page.source === source)
        .flatMap((p) => p.fragments);
    return {
      ours: bySource(PageSource.PRIMARY),
      theirs: bySource(PageSource.COMPETITOR),
    };
  }

  async complete(
    id: string,
    model: string,
    similarities: Array<{ id: string; similarity: number }>,
  ): Promise<void> {
    await this.prisma.$transaction([
      ...similarities.map((entry) =>
        this.prisma.fragment.update({
          where: { id: entry.id },
          data: { similarity: entry.similarity },
        }),
      ),
      this.prisma.analysis.update({
        where: { id },
        data: {
          status: AnalysisStatus.COMPLETED,
          embeddingModel: model,
          completedAt: new Date(),
        },
      }),
    ]);
  }

  async fail(
    id: string,
    failure: {
      reason: FailureReason;
      url: string | null;
      detail: string | null;
    },
  ): Promise<void> {
    await this.prisma.analysis.update({
      where: { id },
      data: {
        status: AnalysisStatus.FAILED,
        failureReason: failure.reason,
        failureUrl: failure.url,
        failureDetail: failure.detail,
      },
    });
  }
}
