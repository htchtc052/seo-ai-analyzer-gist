import { useState } from "react";
import {
  compareWithMedian,
  newness,
  type AnalysisReport,
} from "@/entities/analysis/model/report";
import {
  Help,
  OurOverview,
} from "@/widgets/analysis-summary/ui/AnalysisSummary";

const INITIAL_COUNT = 8;

export function OurParagraphsTable({ report }: { report: AnalysisReport }) {
  const [showAll, setShowAll] = useState(false);
  const paragraphs = report.ours.paragraphs;
  const relevances = paragraphs.map((paragraph) => paragraph.relevance);
  const newnesses = paragraphs.map((paragraph) => newness(paragraph.match.similarity));
  const visible = showAll ? paragraphs : paragraphs.slice(0, INITIAL_COUNT);

  return (
    <div>
      <OurOverview report={report} />
      <div className="sa-panel-intro">
        <h3>Абзацы вашей статьи</h3>
        <p>
          Релевантность показывает связь абзаца с запросом, новизна — насколько
          в выбранных конкурентных статьях не нашлось близкого текста. Абзацы
          идут в том же порядке, что и в вашей статье.
        </p>
      </div>
      <ol className="sa-paragraph-list">
        {visible.map((paragraph) => {
          const relevanceComparison = compareWithMedian(
            paragraph.relevance,
            relevances,
          );
          const newnessComparison = compareWithMedian(
            newness(paragraph.match.similarity),
            newnesses,
          );
          return (
            <li key={paragraph.index}>
              <span className="sa-item-number">Абзац #{paragraph.index + 1}</span>
              <p className="sa-paragraph-preview">{paragraph.text}</p>
              <div className="sa-score-line">
                <span>
                  Релевантность вашего абзаца поисковому запросу{" "}
                  <Help label="Релевантность вашего абзаца поисковому запросу">
                    Смысловое сходство именно этого абзаца вашей статьи с
                    указанным поисковым запросом. Это косинусная оценка, не
                    процент качества.
                  </Help>{" "}
                  <strong>{paragraph.relevance.toFixed(3)}</strong>
                  <MedianComparison
                    comparison={relevanceComparison}
                    label="медианы вашей статьи"
                  />
                </span>
                <span>
                  Новизна конкурентов относительно вашего абзаца{" "}
                  <Help label="Новизна конкурентов относительно вашего абзаца">
                    Из всех фрагментов введённых конкурентных страниц выбран
                    ближайший к этому абзацу. Новизна равна единице минус
                    техническое сходство с ним. Чем она выше, тем меньше среди
                    конкурентов нашлось близкого текста. Это ориентир для
                    проверки, а не вывод о содержательной уникальности.
                  </Help>{" "}
                  <strong>{newness(paragraph.match.similarity).toFixed(3)}</strong>
                  <MedianComparison
                    comparison={newnessComparison}
                    label="медианы новизны по абзацам вашей статьи"
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      {paragraphs.length > INITIAL_COUNT && (
        <button className="sa-more" type="button" onClick={() => setShowAll((current) => !current)}>
          {showAll ? "Свернуть список" : `Показать все ${paragraphs.length} абзацев`}
        </button>
      )}
    </div>
  );
}

function MedianComparison({
  comparison,
  label,
}: {
  comparison: ReturnType<typeof compareWithMedian>;
  label: string;
}) {
  if (comparison.relation === "equal") {
    return (
      <small className="sa-median-comparison">
        На уровне {label} ({comparison.baseline.toFixed(3)})
      </small>
    );
  }

  return (
    <small className="sa-median-comparison">
      На {(comparison.relativeDifference * 100).toFixed(1)}%{" "}
      {comparison.relation === "above" ? "выше" : "ниже"} {label} ({comparison.baseline.toFixed(3)})
    </small>
  );
}
