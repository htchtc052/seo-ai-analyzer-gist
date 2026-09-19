import { useState } from "react";
import topics from "@examples/topics.json";
import { request } from "@/shared/api/client";
import { analysisReceiptSchema } from "@/entities/analysis/contract";

const MAX_COMPETITORS = 4;

export function AnalysisForm({
  disabled,
  onStarted,
}: {
  disabled: boolean;
  onStarted: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [competitors, setCompetitors] = useState([""]);
  const [error, setError] = useState<string | null>(null);

  const filled = competitors.map((value) => value.trim()).filter(Boolean);
  const ready =
    Boolean(query.trim()) && Boolean(url.trim()) && filled.length > 0;

  function changeCompetitor(index: number, value: string) {
    setCompetitors(competitors.map((old, at) => (at === index ? value : old)));
  }

  function fillExample(index: number) {
    const example = topics[index]!;
    setQuery(example.query);
    setUrl(example.url);
    setCompetitors(example.competitorUrls);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const receipt = analysisReceiptSchema.parse(
        await request("/analyses", {
          method: "POST",
          body: JSON.stringify({
            query: query.trim(),
            url: url.trim(),
            competitorUrls: filled,
          }),
        }),
      );
      onStarted(receipt.id);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <form className="sa-card" onSubmit={submit} noValidate>
      <label className="sa-field">
        <span className="sa-label">Поисковый запрос</span>
        <input
          className="sa-input"
          value={query}
          disabled={disabled}
          placeholder="например: настройка robots.txt для сайта"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <label className="sa-field">
        <span className="sa-label">Ваша страница</span>
        <input
          className="sa-input"
          value={url}
          disabled={disabled}
          placeholder="https://example.ru/article"
          onChange={(event) => setUrl(event.target.value)}
        />
      </label>

      <div className="sa-field">
        <span className="sa-label">Страницы конкурентов</span>
        {competitors.map((value, index) => (
          <input
            key={index}
            className="sa-input"
            value={value}
            disabled={disabled}
            placeholder="https://competitor.ru/article"
            onChange={(event) => changeCompetitor(index, event.target.value)}
          />
        ))}
        {competitors.length < MAX_COMPETITORS && (
          <button
            type="button"
            className="sa-link"
            disabled={disabled}
            onClick={() => setCompetitors([...competitors, ""])}
          >
            Добавить конкурента
          </button>
        )}
        <p className="sa-hint">
          От одного до четырёх адресов. Сравниваем только их, остальной сайт не
          обходим.
        </p>
      </div>

      <div className="sa-actions">
        <button
          className="sa-button"
          type="submit"
          disabled={disabled || !ready}
        >
          Сравнить страницы
        </button>
        {topics.map((topic, index) => (
          <button
            key={topic.title}
            type="button"
            className="sa-link"
            disabled={disabled}
            onClick={() => fillExample(index)}
          >
            {topic.title}
          </button>
        ))}
      </div>

      {error && <p className="sa-error">{error}</p>}
    </form>
  );
}
