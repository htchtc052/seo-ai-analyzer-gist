import { Module } from "@nestjs/common";
import { ArticleExtractorService } from "./services/article-extractor.service.js";
import { WebPageService } from "./services/web-page.service.js";

@Module({
  providers: [WebPageService, ArticleExtractorService],
  exports: [WebPageService],
})
export class WebPageModule {}
