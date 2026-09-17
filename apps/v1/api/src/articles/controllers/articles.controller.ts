import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import {
  articleResponseSchema,
  importArticleSchema,
  type ImportArticleDto,
} from "../dto/article.dto.js";
import { ResponseSchema } from "../../common/decorators/response-schema.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { ArticlesService } from "../services/articles.service.js";

@Controller("articles")
export class ArticlesController {
  constructor(
    @Inject(ArticlesService)
    private readonly articles: ArticlesService,
  ) {}

  @Post("import")
  @ResponseSchema(articleResponseSchema)
  async import(
    @Body(new ZodValidationPipe(importArticleSchema)) input: ImportArticleDto,
  ) {
    return { article: await this.articles.importArticle(input.url) };
  }

  @Get(":id")
  @ResponseSchema(articleResponseSchema)
  async findById(@Param("id") id: string) {
    return { article: await this.articles.getArticle(id) };
  }
}
