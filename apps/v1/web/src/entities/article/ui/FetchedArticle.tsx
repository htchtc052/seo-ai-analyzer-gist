import type { Article } from "../model/article";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { Subheading } from "@/shared/ui/typography";

export function FetchedArticle({ article }: { article: Article }) {
  const textLength = article.sections
    .flatMap((section) => section.paragraphs)
    .join(" ").length;

  return (
    <Collapsible className="rounded-lg border">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-left text-sm">
        <Badge variant="secondary">
          Fetched · {textLength.toLocaleString("en")} characters
        </Badge>
        <span className="flex-1 font-medium">{article.title}</span>
        <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-3 px-4 pb-4 text-sm leading-relaxed">
        {article.sections.map((section, index) => (
          <section key={index} className="grid gap-2">
            {section.heading && <Subheading>{section.heading}</Subheading>}
            {section.paragraphs.map((paragraph, pIndex) => (
              <p key={pIndex}>{paragraph}</p>
            ))}
          </section>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
