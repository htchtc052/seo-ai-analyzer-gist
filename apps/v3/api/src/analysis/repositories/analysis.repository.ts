import { Inject, Injectable } from "@nestjs/common";
import type { AnalysisInputDto } from "../dto/analysis-input.schema.js";
import type { AnalysisRun, AnalysisSummary } from "../dto/analysis.types.js";
import {
  toAnalysisRun,
  toAnalysisSummary,
} from "../mappers/analysis.mapper.js";
import { PrismaService } from "../../prisma/services/prisma.service.js";

@Injectable()
export class AnalysisRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async create(input: AnalysisInputDto): Promise<string> {
    const { id } = await this.prisma.analysis.create({
      data: {
        searchQuery: input.searchQuery,
        primaryUrl: input.primaryUrl,
        competitorUrls: input.competitorUrls,
      },
      select: { id: true },
    });
    return id;
  }

  async findById(id: string): Promise<AnalysisRun | null> {
    const run = await this.prisma.analysis.findUnique({ where: { id } });
    return run && toAnalysisRun(run);
  }

  async list(): Promise<AnalysisSummary[]> {
    const runs = await this.prisma.analysis.findMany({
      orderBy: { createdAt: "desc" },
    });
    return runs.map(toAnalysisSummary);
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.prisma.analysis.deleteMany({ where: { id } });
    return count > 0;
  }
}
