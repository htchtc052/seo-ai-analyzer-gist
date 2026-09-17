import { Inject, Injectable } from "@nestjs/common";
import type { StartAnalysisDto } from "../dto/analysis-run.dto.js";
import type { Recommendation } from "../dto/recommendation.dto.js";
import { toStoredArticle } from "../../articles/repositories/articles.repository.js";
import { PrismaService } from "../../prisma/services/prisma.service.js";

const articleRef = { select: { id: true, sourceUrl: true, title: true } };

@Injectable()
export class AnalysisRunsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  create({ competitorIds, ...input }: StartAnalysisDto, scores: number[]) {
    return this.prisma.analysisRun.create({
      data: {
        ...input,
        scores,
        competitors: { connect: competitorIds.map((id) => ({ id })) },
      },
    });
  }

  async findById(id: string) {
    const run = await this.prisma.analysisRun.findUnique({
      where: { id },
      include: { article: true, competitors: true },
    });
    return (
      run && {
        ...run,
        article: toStoredArticle(run.article),
        competitors: run.competitors.map(toStoredArticle),
      }
    );
  }

  findRecent() {
    return this.prisma.analysisRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        article: articleRef,
        _count: { select: { competitors: true } },
      },
    });
  }

  delete(id: string) {
    return this.prisma.analysisRun.delete({ where: { id } });
  }

  saveRecommendation(id: string, recommendation: Recommendation) {
    return this.prisma.analysisRun.update({
      where: { id },
      data: recommendation,
    });
  }
}
