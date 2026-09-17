import { Inject, Injectable } from "@nestjs/common";
import type { ArticleSection } from "../dto/article.dto.js";
import type { Article as ArticleRow } from "@prisma/client";
import { PrismaService } from "../../prisma/services/prisma.service.js";
import type { ExtractedArticle } from "../../web-page/services/article-extractor.service.js";

export type StoredArticle = Omit<ArticleRow, "sections"> & {
  sections: ArticleSection[];
};

export function toStoredArticle(row: ArticleRow): StoredArticle {
  return { ...row, sections: row.sections as ArticleSection[] };
}

@Injectable()
export class ArticlesRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async create(
    data: ExtractedArticle & { sourceUrl: string },
  ): Promise<StoredArticle> {
    return toStoredArticle(await this.prisma.article.create({ data }));
  }

  async findById(id: string): Promise<StoredArticle | null> {
    const row = await this.prisma.article.findUnique({ where: { id } });
    return row && toStoredArticle(row);
  }
}
