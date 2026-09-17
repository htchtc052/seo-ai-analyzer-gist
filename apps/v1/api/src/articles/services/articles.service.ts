import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Article } from "../dto/article.dto.js";
import { WebPageService } from "../../web-page/services/web-page.service.js";
import { ArticleImportException } from "../exceptions/article-import.exception.js";
import {
  ArticlesRepository,
  type StoredArticle,
} from "../repositories/articles.repository.js";

const MIN_TEXT_LENGTH = 500;

@Injectable()
export class ArticlesService {
  constructor(
    @Inject(ArticlesRepository)
    private readonly articles: ArticlesRepository,
    @Inject(WebPageService)
    private readonly webPages: WebPageService,
  ) {}

  async importArticle(url: string): Promise<Article> {
    const extracted = await this.webPages.readArticle(url);
    if (!extracted)
      throw new ArticleImportException(
        "Could not find article text on the page",
      );

    const textLength = extracted.sections
      .flatMap((section) => section.paragraphs)
      .join(" ").length;
    if (textLength < MIN_TEXT_LENGTH) {
      throw new ArticleImportException(
        `Found only ${textLength} characters of article text, at least ${MIN_TEXT_LENGTH} are needed`,
      );
    }
    if (!extracted.title)
      throw new ArticleImportException("The page has no title");

    return toArticle(
      await this.articles.create({ sourceUrl: url, ...extracted }),
    );
  }

  async getArticle(id: string): Promise<Article> {
    const article = await this.articles.findById(id);
    if (!article)
      throw new NotFoundException({
        code: "ARTICLE_NOT_FOUND",
        message: "Article not found",
      });
    return toArticle(article);
  }
}

function toArticle(article: StoredArticle): Article {
  return { ...article, importedAt: article.importedAt.toISOString() };
}
