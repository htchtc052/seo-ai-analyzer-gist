import { Module } from "@nestjs/common";
import { EmbeddingsService } from "./services/embeddings.service.js";

@Module({
  providers: [EmbeddingsService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
