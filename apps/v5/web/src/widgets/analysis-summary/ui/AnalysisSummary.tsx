import type { AnalysisReport } from "@/entities/analysis/model/report";

export function Help({ label, children }: { label: string; children: string }) {
  return (
    <details className="sa-help">
      <summary aria-label={`Пояснение: ${label}`}>?</summary>
      <span className="sa-help-content">{children}</span>
    </details>
  );
}

export function IdeaSelection({
  thresholds,
  level,
  onChange,
}: {
  thresholds: number[];
  level: number;
  onChange: (level: number) => void;
}) {
  return (
    <div className="sa-threshold">
      <div className="sa-threshold-heading">
        <label htmlFor="sa-idea-range">
          Минимальная новизна рекомендованных абзацев
        </label>
        <Help label="Минимальная новизна рекомендованных абзацев">
          Берём абзацы конкурентов, чья релевантность запросу выше средней
          релевантности абзацев вашей статьи. Новизна — это единица минус
          техническое сходство с ближайшим вашим абзацем. Сдвиг вправо оставляет
          среди релевантных только более новые фрагменты; сама релевантность не
          меняется.
        </Help>
        <output htmlFor="sa-idea-range">{thresholds[level]!.toFixed(3)}</output>
      </div>
      <input
        id="sa-idea-range"
        aria-label="Минимальная новизна рекомендованных абзацев"
        type="range"
        min="0"
        max={thresholds.length - 1}
        step="1"
        value={level}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="sa-threshold-ticks" aria-hidden="true">
        {thresholds.map((threshold, index) => (
          <span key={`${threshold}-${index}`} />
        ))}
      </div>
      <div className="sa-threshold-ends">
        <span>Шире · больше абзацев</span>
        <span>Обычно</span>
        <span>Строже · только более новые</span>
      </div>
    </div>
  );
}

export function OurOverview({ report }: { report: AnalysisReport }) {
  return (
    <dl className="sa-metrics">
      <div>
        <dt>Абзацев в вашей статье</dt>
        <dd>{report.ours.paragraphs.length}</dd>
      </div>
      <div>
        <dt>
          Средняя релевантность абзацев запросу
          <Help label="Средняя релевантность абзацев запросу">
            Для каждого вашего абзаца измерено смысловое сходство с указанным
            поисковым запросом. Здесь показано среднее значение. Это косинусная
            оценка, а не процент качества или прогноз позиции в поиске.
          </Help>
        </dt>
        <dd>{report.ours.averageRelevance.toFixed(3)}</dd>
      </div>
    </dl>
  );
}
