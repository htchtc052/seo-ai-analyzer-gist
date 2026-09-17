import type { Recommendation } from "@/entities/analysis";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { formatPercent, formatScore } from "./report-format";

export type DialogSubject = {
  title: string;
  url: string;
  fragments: Recommendation[];
};

export function FragmentDialog({
  subject,
  onClose,
}: {
  subject: DialogSubject | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={subject !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogTitle>{subject?.title}</DialogTitle>
        <DialogDescription className="text-left text-xs">
          {subject?.url}
        </DialogDescription>

        <ol className="grid gap-5">
          {subject?.fragments.map((item) => (
            <li key={item.rank} className="grid gap-2">
              {item.heading && (
                <span className="text-xs text-muted-foreground">
                  {item.heading}
                </span>
              )}
              <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                <Metric
                  label="Релевантность"
                  value={formatScore(item.relevance)}
                />
                <Metric label="Новизна" value={formatPercent(item.novelty)} />
                <Metric
                  label="Ценность для отбора"
                  value={formatScore(item.priority)}
                />
              </dl>
              <p className="text-sm leading-6">{item.text}</p>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </span>
  );
}
