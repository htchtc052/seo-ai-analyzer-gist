import { Globe2, ScanSearch } from "lucide-react";
import type { ReactNode } from "react";
import { AnalysisList, useAnalyses } from "@/entities/analysis";
import { DeleteAnalysisButton } from "@/features/delete-analysis";

export function AnalysesPage() {
  const { analyses } = useAnalyses();

  return (
    <div className="grid gap-12">
      <section className="grid gap-8">
        <div className="grid gap-4">
          <h1 className="max-w-4xl text-6xl font-semibold tracking-tight text-balance">
            Найдите темы, которые конкурент раскрывает иначе.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Сравните два домена по одному поисковому запросу. Краулер идёт от
            корня и выбирает страницы по теме, а релевантность и сходство
            считаются отдельно — без искусственного общего балла.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 rounded-xl border bg-secondary/50 p-6">
          <Feature
            icon={<Globe2 className="size-5" />}
            title="Обход домена по теме"
            description="До 30 содержательных страниц с домена. Очередь обхода упорядочена по близости текста ссылки к запросу."
          />
          <Feature
            icon={<ScanSearch className="size-5" />}
            title="Две независимые оценки"
            description="Релевантность показывает пользу для запроса, а сходство — что уже есть на вашем сайте."
          />
        </div>
      </section>
      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Отчёты</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Результаты сохраняются и доступны после перезапуска приложения. У
            каждого отчёта свой адрес — им можно поделиться.
          </p>
        </div>
        <AnalysisList
          analyses={analyses}
          action={(analysis) => (
            <DeleteAnalysisButton
              id={analysis.id}
              searchQuery={analysis.searchQuery}
            />
          )}
        />
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4">
      <span className="grid size-10 place-items-center rounded-lg bg-background text-primary shadow-sm">
        {icon}
      </span>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
