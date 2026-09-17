import type { FragmentScore } from "./analysis-run";

export type ScoredSection = {
  heading: string | null;
  fragments: FragmentScore[];
};

export function groupBySection(fragments: FragmentScore[]): ScoredSection[] {
  const sections: ScoredSection[] = [];
  for (const fragment of fragments) {
    const last = sections.at(-1);
    if (last && last.heading === fragment.heading)
      last.fragments.push(fragment);
    else sections.push({ heading: fragment.heading, fragments: [fragment] });
  }
  return sections;
}
