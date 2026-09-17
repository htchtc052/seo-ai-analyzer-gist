import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type ColumnHelpProps = {
  label: string;
  reference?: string;
  formula: string;
  note: string;
};

export function ColumnHelp({
  label,
  reference,
  formula,
  note,
}: ColumnHelpProps) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
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
          <span className="block font-semibold">
            {reference ? `${label} ${reference}` : label}
          </span>
          <code className="mt-1.5 block text-[0.6875rem] leading-5">
            {formula}
          </code>
          <span className="mt-2 block">{note}</span>
        </TooltipContent>
      </Tooltip>
    </span>
  );
}
