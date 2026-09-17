import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
} from "@nestjs/common";
import {
  analysisRunListSchema,
  analysisRunResponseSchema,
  featuresResponseSchema,
  startAnalysisSchema,
  type StartAnalysisDto,
} from "../dto/analysis-run.dto.js";
import { ResponseSchema } from "../../common/decorators/response-schema.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { AnalysisService } from "../services/analysis.service.js";

@Controller("analyses")
export class AnalysisController {
  constructor(
    @Inject(AnalysisService)
    private readonly analysis: AnalysisService,
  ) {}

  @Post()
  @ResponseSchema(analysisRunResponseSchema)
  async start(
    @Body(new ZodValidationPipe(startAnalysisSchema)) input: StartAnalysisDto,
  ) {
    return { run: await this.analysis.startAnalysis(input) };
  }

  @Get()
  @ResponseSchema(analysisRunListSchema)
  async findRecent() {
    return { runs: await this.analysis.listRecentRuns() };
  }

  @Get("features")
  @ResponseSchema(featuresResponseSchema)
  features() {
    return { features: this.analysis.getFeatures() };
  }

  @Get(":id")
  @ResponseSchema(analysisRunResponseSchema)
  async findById(@Param("id") id: string) {
    return { run: await this.analysis.getRun(id) };
  }

  @Delete(":id")
  @HttpCode(204)
  async delete(@Param("id") id: string) {
    await this.analysis.deleteRun(id);
  }
}
