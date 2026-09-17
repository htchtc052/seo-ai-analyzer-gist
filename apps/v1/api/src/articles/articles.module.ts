import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { WebPageModule } from "../web-page/web-page.module.js";
import { ArticlesController } from "./controllers/articles.controller.js";
import { ArticlesRepository } from "./repositories/articles.repository.js";
import { ArticlesService } from "./services/articles.service.js";

@Module({
  imports: [PrismaModule, WebPageModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticlesRepository],
  exports: [ArticlesService],
})
export class ArticlesModule {}
