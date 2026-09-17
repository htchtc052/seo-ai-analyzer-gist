import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type ColumnHelpProps = {
  label: string;
  formula: string;
  note: string;
};

export function ColumnHelp({ label, formula, note }: ColumnHelpProps) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Формула: ${label}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <code className="block text-[0.6875rem] leading-5">{formula}</code>
          <span className="mt-2 block">{note}</span>
        </TooltipContent>
      </Tooltip>
    </span>
  );
}
