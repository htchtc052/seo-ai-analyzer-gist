import type { ComponentProps } from "react";
import type { RecommendationStatus as Status } from "../model/recommendation-status";
import { Badge } from "@/shared/ui/badge";

const badges: Record<
  Status,
  { label: string; variant: ComponentProps<typeof Badge>["variant"] }
> = {
  "scores-only": { label: "Scores only", variant: "outline" },
  pending: { label: "Preparing recommendations", variant: "secondary" },
  ready: { label: "Recommendations ready", variant: "default" },
  failed: { label: "Recommendations failed", variant: "destructive" },
};

export function RecommendationStatus({ status }: { status: Status }) {
  const { label, variant } = badges[status];
  return <Badge variant={variant}>{label}</Badge>;
}
