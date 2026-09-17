import { ExternalLink } from "lucide-react";
import type { CompletedAnalysis } from "@/entities/analysis";

export function SelectedFragments({
  run,
  poolSize,
}: {
  run: CompletedAnalysis;
  poolSize: number;
}) {
  const picked = run.pages
    .filter((page) => page.status === "scored")
    .flatMap((page) => page.recommendations.map((item) => ({ ...item, page })))
    .toSorted((left, right) => left.rank - right.rank);

  if (picked.length === 0) return null;

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-semibold">Что добавить</h2>
        <span className="text-xs text-muted-foreground">
          {picked.length} из {poolSize} абзацев всех конкурентов — ценные и не
          повторяющие друг друга
        </span>
      </div>

      <ol className="grid gap-3">
        {picked.map((item) => (
          <li
            key={item.rank}
            className="grid gap-1.5 rounded-xl border bg-card px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">
                {item.rank}
              </span>
              <a
                href={item.page.url}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-1 hover:text-foreground"
              >
                {item.page.title}
                <ExternalLink className="size-3 shrink-0" />
              </a>
              {item.heading && <span>· {item.heading}</span>}
            </div>
            <p className="text-sm leading-6">{item.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
