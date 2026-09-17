import { Module } from "@nestjs/common";
import { PrismaService } from "./services/prisma.service.js";

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
