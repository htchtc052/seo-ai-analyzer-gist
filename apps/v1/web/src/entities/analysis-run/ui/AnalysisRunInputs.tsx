import type { AnalysisRun } from "../model/analysis-run";
import { ExternalLink } from "@/shared/ui/external-link";

export function AnalysisRunInputs({ run }: { run: AnalysisRun }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm [&_dt]:text-muted-foreground">
      <dt>Query</dt>
      <dd>{run.query}</dd>
      <dt>Competitors</dt>
      <dd>
        {run.competitors.length === 0 ? (
          "—"
        ) : (
          <ul className="grid gap-1">
            {run.competitors.map((competitor) => (
              <li key={competitor.id}>
                <ExternalLink href={competitor.sourceUrl}>
                  {competitor.title}
                </ExternalLink>
              </li>
            ))}
          </ul>
        )}
      </dd>
      <dt>Audience</dt>
      <dd>{run.audience || "—"}</dd>
      <dt>Purpose</dt>
      <dd>{run.purpose || "—"}</dd>
      <dt>Niche</dt>
      <dd>{run.niche || "—"}</dd>
      <dt>Started</dt>
      <dd>{new Date(run.createdAt).toLocaleString()}</dd>
    </dl>
  );
}
