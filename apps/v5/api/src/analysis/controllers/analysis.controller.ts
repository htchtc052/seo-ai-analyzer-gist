import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import {
  analysisInputSchema,
  type AnalysisInputDto,
} from "../dto/analysis-input.schema.js";
import type { AnalysisRun } from "../analysis.types.js";
import { AnalysisService } from "../services/analysis.service.js";

@Controller("analyses")
export class AnalysisController {
  constructor(
    @Inject(AnalysisService)
    private readonly analysis: AnalysisService,
  ) {}

  @Post()
  analyze(
    @Body(new ZodValidationPipe(analysisInputSchema)) input: AnalysisInputDto,
  ): { id: string } {
    return this.analysis.analyze(input);
  }

  @Get(":id")
  find(@Param("id") id: string): AnalysisRun {
    return this.analysis.find(id);
  }
}
