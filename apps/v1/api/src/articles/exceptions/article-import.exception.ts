import { UnprocessableEntityException } from "@nestjs/common";

export class ArticleImportException extends UnprocessableEntityException {
  constructor(message: string) {
    super({ code: "ARTICLE_IMPORT_FAILED", message });
  }
}
