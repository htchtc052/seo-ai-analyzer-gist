import { useEffect, useState } from "react";
import { request } from "@/shared/api/client";
import { analysisRunSchema, type AnalysisRun } from "./contract";

const POLL_INTERVAL_MS = 1_000;

export function useAnalysis(id: string | null) {
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setRun(null);
    setError(null);

    let timer: number | undefined;
    let stopped = false;

    const poll = async () => {
      try {
        const next = analysisRunSchema.parse(await request(`/analyses/${id}`));
        if (stopped) return;
        setRun(next);
        if (next.status === "running")
          timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch (cause) {
        if (!stopped) setError((cause as Error).message);
      }
    };
    void poll();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [id]);

  return { run, error };
}
