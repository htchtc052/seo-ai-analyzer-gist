import { Module } from "@nestjs/common";
import { ContentExtractorService } from "./services/content-extractor.service.js";
import { PageClientService } from "./services/page-client.service.js";
import { RobotsService } from "./services/robots.service.js";
import { SitemapService } from "./services/sitemap.service.js";
import { SiteCrawlerService } from "./services/site-crawler.service.js";

@Module({
  providers: [
    ContentExtractorService,
    PageClientService,
    RobotsService,
    SitemapService,
    SiteCrawlerService,
  ],
  exports: [SiteCrawlerService],
})
export class CrawlerModule {}
