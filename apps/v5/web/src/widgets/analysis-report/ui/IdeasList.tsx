import { useState } from "react";
import {
  newness,
  type AnalysisReport,
  type Idea,
} from "@/entities/analysis/model/report";
import {
  Help,
  IdeaSelection,
} from "@/widgets/analysis-summary/ui/AnalysisSummary";

const INITIAL_COUNT = 6;

export function IdeasList({
  report,
  ideas,
  thresholds,
  level,
  onLevelChange,
}: {
  report: AnalysisReport;
  ideas: Idea[];
  thresholds: number[];
  level: number;
  onLevelChange: (level: number) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? ideas : ideas.slice(0, INITIAL_COUNT);

  return (
    <div>
      <div className="sa-panel-intro">
        <h3>Абзацы конкурентов, рекомендованные для дополнения</h3>
        <p>
          Абзацы конкурентов с релевантностью запросу выше средней по вашей
          статье ({report.ours.averageRelevance.toFixed(3)}) и достаточной
          новизной относительно неё. Это кандидаты для редакторской проверки.
        </p>
      </div>
      <IdeaSelection
        thresholds={thresholds}
        level={level}
        onChange={onLevelChange}
      />
      <SourceOverview report={report} ideas={ideas} />
      {ideas.length === 0 ? (
        <p className="sa-empty">При таком отборе тем для проверки не найдено.</p>
      ) : (
        <>
          <p className="sa-list-count">
            Найдено {ideas.length}. Сначала показаны абзацы с большей
            релевантностью запросу, затем — более новые.
          </p>
          <ol className="sa-idea-list">
            {visible.map(({ competitorIndex, paragraph }) => {
              const competitor = report.competitors[competitorIndex]!;
              return (
                <li key={`${competitor.url}-${paragraph.index}`}>
                  <p className="sa-idea-text">{paragraph.text}</p>
                  <div className="sa-source-article">
                    <a
                      className="sa-source-link"
                      href={competitor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={competitor.title}
                    >
                      {competitor.title}
                    </a>
                    <a
                      className="sa-source-domain"
                      href={competitor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {competitor.domain}
                    </a>
                  </div>
                  <div className="sa-score-line">
                    <span>
                      Релевантность этого абзаца запросу{" "}
                      <Help label="Релевантность абзаца конкурента запросу">
                        Смысловое сходство этого конкретного абзаца конкурента
                        с указанным поисковым запросом. Это косинусная оценка,
                        не процент качества.
                      </Help>{" "}
                      <strong>{paragraph.relevance.toFixed(3)}</strong>
                    </span>
                    <span>
                      Новизна относительно вашей статьи{" "}
                      <Help label="Новизна относительно вашей статьи">
                        Единица минус максимальное техническое сходство этого
                        абзаца с одним из абзацев вашей статьи. Чем новизна
                        выше, тем меньше близкого текста нашлось у вас.
                      </Help>{" "}
                      <strong>{newness(paragraph.match.similarity).toFixed(3)}</strong>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
          {ideas.length > INITIAL_COUNT && (
            <button
              className="sa-more"
              type="button"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? "Свернуть список" : `Показать все ${ideas.length}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function SourceOverview({
  report,
  ideas,
}: {
  report: AnalysisReport;
  ideas: Idea[];
}) {
  const counts = report.competitors.map(() => 0);
  ideas.forEach(({ competitorIndex }) => {
    counts[competitorIndex]! += 1;
  });
  const maximum = Math.max(...counts, 1);

  return (
    <section className="sa-source-overview" aria-label="Источники рекомендаций">
      <div className="sa-source-overview-heading">
        <h4>Источники рекомендаций</h4>
        <span>Сколько рекомендованных абзацев найдено в каждой статье</span>
      </div>
      <ul>
        {report.competitors.map((competitor, index) => (
          <li key={competitor.url}>
            <div className="sa-source-article">
              <a
                className="sa-source-link"
                href={competitor.url}
                target="_blank"
                rel="noopener noreferrer"
                title={competitor.title}
              >
                {competitor.title}
              </a>
              <a
                className="sa-source-domain"
                href={competitor.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {competitor.domain}
              </a>
            </div>
            <div className="sa-source-progress">
              <span style={{ width: `${(counts[index]! / maximum) * 100}%` }} />
            </div>
            <strong>{counts[index]}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
