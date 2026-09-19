import { Module } from "@nestjs/common";
import { ContentExtractorService } from "./services/content-extractor.service.js";
import { PageClientService } from "./services/page-client.service.js";

@Module({
  providers: [ContentExtractorService, PageClientService],
  exports: [ContentExtractorService, PageClientService],
})
export class PagesModule {}
