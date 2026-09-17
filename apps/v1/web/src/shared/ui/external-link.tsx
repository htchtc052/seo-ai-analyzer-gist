import { Button } from "@/shared/ui/button";

export function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <Button asChild variant="link" className="h-auto p-0 whitespace-normal">
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    </Button>
  );
}
