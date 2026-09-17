import { ExternalLink, Info } from "lucide-react";
import type { CompletedAnalysis, Recommendation } from "@/entities/analysis";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { formatScore } from "./report-format";

const QUOTE_LENGTH = 200;

export function RecommendationList({ run }: { run: CompletedAnalysis }) {
  if (run.recommendations.length === 0) return null;

  return (
    <TooltipProvider>
      <section className="grid gap-3">
        <h2 className="font-semibold">Что добавить</h2>

        <ol className="grid gap-3">
          {run.recommendations.map((item, index) => (
            <Item key={`${item.url}-${index}`} item={item} />
          ))}
        </ol>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Отбор GIST: ценность {formatScore(run.selection.utility)},
          разнообразие {formatScore(run.selection.diversity)}, итог{" "}
          {formatScore(run.selection.objective)}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Что означают числа отбора"
                className="text-muted-foreground hover:text-foreground"
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="block font-semibold">Числа отбора</span>
              <code className="mt-1.5 block text-[0.6875rem] leading-5">
                итог = ценность + 1 × разнообразие
              </code>
              <span className="mt-2 block">
                Ценность — сумма разрывов выбранных фрагментов. Разнообразие —
                наименьшее косинусное расстояние между ними: чем больше, тем
                меньше они повторяют друг друга. Числа относятся к набору
                целиком, а не к отдельной строке, и сравнимы только между
                запусками с одинаковым числом рекомендаций.
              </span>
            </TooltipContent>
          </Tooltip>
        </p>
      </section>
    </TooltipProvider>
  );
}

function Item({ item }: { item: Recommendation }) {
  const short = toShortQuote(item.text);

  return (
    <li className="rounded-xl border bg-card px-4 py-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-4">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="group flex items-start gap-1.5 text-xs text-muted-foreground"
        >
          {item.heading ?? item.title}
          <ExternalLink className="mt-0.5 size-3 shrink-0" />
        </a>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          разрыв {formatScore(item.gap)}
        </span>
      </div>

      {short === item.text ? (
        <p className="text-sm leading-6">{item.text}</p>
      ) : (
        <details className="group">
          <summary className="cursor-pointer list-none text-sm leading-6">
            <span className="group-open:hidden">{short}… </span>
            <span className="text-xs text-primary group-open:hidden">
              показать целиком
            </span>
            <span className="hidden group-open:inline">{item.text}</span>
          </summary>
        </details>
      )}
    </li>
  );
}

function toShortQuote(text: string): string {
  if (text.length <= QUOTE_LENGTH) return text;
  const cut = text.slice(0, QUOTE_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
}
