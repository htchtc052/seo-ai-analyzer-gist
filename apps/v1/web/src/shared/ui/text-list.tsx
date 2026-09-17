import { SectionTitle } from "./typography";

export function TextList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="grid gap-2">
      <SectionTitle>{title}</SectionTitle>
      <ul className="ml-5 list-disc text-sm leading-relaxed">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
