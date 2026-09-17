import type { ComponentProps } from "react";
import { cn } from "cn";

export function Muted({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export function SectionTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("font-semibold", className)} {...props} />;
}

export function Subheading({ className, ...props }: ComponentProps<"h4">) {
  return <h4 className={cn("text-sm font-semibold", className)} {...props} />;
}
