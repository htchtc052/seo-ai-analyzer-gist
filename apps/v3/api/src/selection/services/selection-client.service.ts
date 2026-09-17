import { Inject, Injectable } from "@nestjs/common";
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
    const response = await fetch(`${this.baseUrl}/select`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        vectors: candidates.map((candidate) => candidate.embedding),
        weights: candidates.map((candidate) => candidate.weight),
        k: count,
        lam: DIVERSITY_WEIGHT,
        seed: SEED,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch((error: Error) => {
      throw new SelectionError(
        `Selection service is unreachable: ${error.message}`,
      );
    });

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
