import { Inject, Injectable } from "@nestjs/common";
import { setTimeout } from "node:timers/promises";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../config/config.schema.js";
import {
  SelectionError,
  type Selection,
  type SelectionCandidate,
} from "../selection.types.js";

const DIVERSITY_WEIGHT = 1;
const SEED = 42;
const TIMEOUT_MS = 30_000;
const ATTEMPTS = 3;
const RETRY_DELAY_MS = 1_000;

type SelectResponse = { indices: number[] };

@Injectable()
export class SelectionClientService {
  private readonly baseUrl: string;

  constructor(
    @Inject(ConfigService)
    config: ConfigService<AppConfig, true>,
  ) {
    this.baseUrl = config.get("GIST_URL", { infer: true });
  }

  async select(
    candidates: SelectionCandidate[],
    count: number,
  ): Promise<Selection> {
    const request = JSON.stringify({
      vectors: candidates.map((candidate) => candidate.embedding),
      weights: candidates.map((candidate) => candidate.weight),
      k: count,
      lam: DIVERSITY_WEIGHT,
      seed: SEED,
    });

    let failure: Error | undefined;
    let response: Response | undefined;

    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      try {
        response = await fetch(`${this.baseUrl}/select`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: request,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        break;
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        failure = error;
        if (attempt + 1 < ATTEMPTS) await setTimeout(RETRY_DELAY_MS);
      }
    }

    if (!response)
      throw new SelectionError(
        `Selection service is unreachable: ${failure!.message}`,
      );

    if (!response.ok)
      throw new SelectionError(
        `Selection service answered with HTTP ${response.status}`,
      );

    const body = (await response.json()) as SelectResponse;
    return {
      ids: body.indices.map((index) => {
        const candidate = candidates[index];
        if (!candidate)
          throw new SelectionError(`Selection index ${index} is out of range`);
        return candidate.id;
      }),
    };
  }
}
