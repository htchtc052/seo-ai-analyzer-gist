import { Minus, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { formatScore } from "./report-format";

const STEP = 0.05;
const MIN = 0.05;
const MAX = 0.9;

type RelevanceThresholdProps = {
  value: number;
  onChange: (value: number) => void;
};

export function RelevanceThreshold({
  value,
  onChange,
}: RelevanceThresholdProps) {
  const shift = (delta: number) =>
    onChange(Math.min(MAX, Math.max(MIN, Number((value + delta).toFixed(2)))));

  return (
    <section className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Порог релевантности</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Понизить порог"
          onClick={() => shift(-STEP)}
        >
          <Minus />
        </Button>
        <span className="w-12 text-center text-sm tabular-nums">
          {formatScore(value)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Повысить порог"
          onClick={() => shift(STEP)}
        >
          <Plus />
        </Button>
      </div>
      <p className="min-w-64 flex-1 text-xs leading-5 text-muted-foreground">
        Подсвечивает строки, чья релевантность не ниже порога, и ничего не
        пересчитывает. Порог стоит только на релевантности: она абсолютна, её
        диапазоны задаёт модель, и 0.25 — уровень несвязанного с запросом
        текста. Новизна и приоритет относительны — они зависят от того, что
        обход нашёл у вас, поэтому отсечки по ним не имели бы смысла.
      </p>
    </section>
  );
}
