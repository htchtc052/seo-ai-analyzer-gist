import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import {
  analysisInputSchema,
  type AnalysisInputDto,
} from "../dto/analysis-input.schema.js";
import {
  type AnalysisReceipt,
  type AnalysisRun,
  type AnalysisSummary,
} from "../dto/analysis.types.js";
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
  ): Promise<AnalysisReceipt> {
    return this.analysis.analyze(input);
  }

  @Get()
  list(): Promise<AnalysisSummary[]> {
    return this.analysis.list();
  }

  @Get(":id")
  find(@Param("id", new ParseUUIDPipe()) id: string): Promise<AnalysisRun> {
    return this.analysis.find(id);
  }

  @Delete(":id")
  @HttpCode(204)
  delete(@Param("id", new ParseUUIDPipe()) id: string): Promise<void> {
    return this.analysis.delete(id);
  }
}
