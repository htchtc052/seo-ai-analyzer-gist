import { Inject, Injectable, Logger } from "@nestjs/common";
import robotsParser from "robots-parser";
import { PageClientService } from "./page-client.service.js";

export type RobotRules = ReturnType<typeof robotsParser>;

@Injectable()
export class RobotsService {
  private readonly logger = new Logger(RobotsService.name);

  constructor(
    @Inject(PageClientService)
    private readonly client: PageClientService,
  ) {}

  async load(origin: string): Promise<RobotRules> {
    const url = `${origin}/robots.txt`;
    const rules = await this.client.loadText(url).catch((error: Error) => {
      this.logger.warn(`No robots.txt at ${url}: ${error.message}`);
      return "";
    });
    return robotsParser(url, rules);
  }
}
