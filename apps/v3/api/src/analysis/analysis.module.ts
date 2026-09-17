import { Module } from "@nestjs/common";
import { AnalysisController } from "./controllers/analysis.controller.js";
import { AnalysisRepository } from "./repositories/analysis.repository.js";
import { AnalysisService } from "./services/analysis.service.js";
import { EmbeddingsModule } from "../embeddings/embeddings.module.js";
import { PagesModule } from "../pages/pages.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
  imports: [PrismaModule, PagesModule, EmbeddingsModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, AnalysisRepository],
})
export class AnalysisModule {}
