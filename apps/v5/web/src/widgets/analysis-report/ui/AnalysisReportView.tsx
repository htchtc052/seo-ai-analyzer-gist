import { useId, useState } from "react";
import {
  newnessChoices,
  selectIdeas,
  type AnalysisReport,
} from "@/entities/analysis/model/report";
import { IdeasList } from "./IdeasList";
import { OurParagraphsTable } from "./OurParagraphsTable";

const tabs = ["ours", "ideas"] as const;
type Tab = (typeof tabs)[number];

export function AnalysisReportView({
  report,
  query,
}: {
  report: AnalysisReport;
  query: string;
}) {
  const thresholds = newnessChoices(report);
  const [level, setLevel] = useState(() => Math.floor(thresholds.length / 2));
  const [activeTab, setActiveTab] = useState<Tab>("ours");
  const tabId = useId();
  const ideas = selectIdeas(report, thresholds[level]!);
  const labels: Record<Tab, string> = {
    ours: "Ваша статья",
    ideas: `Абзацы конкурентов для дополнения · ${ideas.length}`,
  };

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    tab: Tab,
  ) {
    const index = tabs.indexOf(tab);
    const next =
      event.key === "ArrowRight"
        ? tabs[(index + 1) % tabs.length]
        : event.key === "ArrowLeft"
          ? tabs[(index - 1 + tabs.length) % tabs.length]
          : event.key === "Home"
            ? tabs[0]
            : event.key === "End"
              ? tabs[tabs.length - 1]
              : null;
    if (!next) return;
    event.preventDefault();
    setActiveTab(next);
    document.getElementById(`${tabId}-${next}-tab`)?.focus();
  }

  return (
    <section className="sa-report" aria-label="Результат анализа">
      <header className="sa-report-header">
        <span className="sa-eyebrow">Проанализирована ваша страница</span>
        <h2>{report.ours.title}</h2>
        <a href={report.ours.url} target="_blank" rel="noopener noreferrer">
          {report.ours.url}
        </a>
        <p>
          Поисковый запрос: <strong>{query}</strong>
        </p>
      </header>

      {report.failed.length > 0 && (
        <p className="sa-error">
          Не прочитаны: {report.failed.map((page) => page.url).join(", ")}
        </p>
      )}

      <div className="sa-tabs" role="tablist" aria-label="Разделы отчёта">
        {tabs.map((tab) => (
          <button
            key={tab}
            id={`${tabId}-${tab}-tab`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`${tabId}-${tab}-panel`}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(event) => handleTabKeyDown(event, tab)}
          >
            {labels[tab]}
          </button>
        ))}
      </div>

      <div
        className="sa-tab-panel"
        id={`${tabId}-${activeTab}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabId}-${activeTab}-tab`}
        tabIndex={0}
      >
        {activeTab === "ours" && <OurParagraphsTable report={report} />}
        {activeTab === "ideas" && (
          <IdeasList
            report={report}
            ideas={ideas}
            thresholds={thresholds}
            level={level}
            onLevelChange={setLevel}
          />
        )}
      </div>
    </section>
  );
}
