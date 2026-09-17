import type { FragmentScore } from "../model/analysis-run";
import { Progress } from "@/shared/ui/progress";
import { groupBySection } from "../model/scored-sections";
import { Muted, Subheading } from "@/shared/ui/typography";

export function ScoreChart({ fragments }: { fragments: FragmentScore[] }) {
  const sections = groupBySection(fragments);

  return (
    <figure className="grid gap-6">
      <figcaption>
        <Muted>
          Cosine similarity of each paragraph to the query, on a 0–1 scale
        </Muted>
      </figcaption>
      {sections.map((section, sectionIndex) => (
        <section key={sectionIndex} className="grid gap-3">
          <Subheading>{section.heading ?? "Introduction"}</Subheading>
          <ol className="grid gap-4">
            {section.fragments.map((fragment, index) => (
              <li
                key={index}
                className="grid grid-cols-[1fr_3rem] items-center gap-x-3 gap-y-1"
              >
                <Progress value={Math.max(fragment.score, 0) * 100} />
                <span className="text-right text-sm tabular-nums">
                  {fragment.score.toFixed(2)}
                </span>
                <span className="col-span-2 text-xs leading-relaxed text-muted-foreground">
                  {fragment.text}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </figure>
  );
}
