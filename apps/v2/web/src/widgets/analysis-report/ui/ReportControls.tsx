import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { formatScore } from "./report-format";

const MIN = 0.05;
const MAX = 0.9;
const STEP = 0.01;

type ReportControlsProps = {
  threshold: number;
  onThreshold: (value: number) => void;
  since: string;
  onSince: (value: string) => void;
};

export function ReportControls({
  threshold,
  onThreshold,
  since,
  onSince,
}: ReportControlsProps) {
  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border bg-muted/20 px-4 py-2.5">
      <div className="flex min-w-72 flex-1 items-center gap-3">
        <label htmlFor="threshold" className="text-sm whitespace-nowrap">
          Порог релевантности
        </label>
        <input
          id="threshold"
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={threshold}
          onChange={(event) => onThreshold(Number(event.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-primary"
        />
        <span className="w-11 text-sm tabular-nums">
          {formatScore(threshold)}
        </span>
        <Help>
          Подсвечивает строки, чья релевантность не ниже порога, и ничего не
          пересчитывает. Порог стоит только на релевантности: она абсолютна, её
          диапазоны задаёт модель, и 0.25 — уровень несвязанного с запросом
          текста. Новизна и приоритет относительны и зависят от того, что обход
          нашёл у вас, поэтому отсечки по ним не имели бы смысла.
        </Help>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="since" className="text-sm whitespace-nowrap">
          Не старше
        </label>
        <input
          id="since"
          type="date"
          value={since}
          onChange={(event) => onSince(event.target.value)}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        />
        <Help>
          Убирает из обеих таблиц страницы с датой раньше выбранной и
          пересчитывает строки доменов по оставшимся. Страницы без даты
          остаются: отсутствие даты не означает, что страница старая. Дату берём
          из мета-тегов страницы, а при их отсутствии — из lastmod карты сайта;
          источник указан в колонке.
        </Help>
      </div>
    </section>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Пояснение"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}
