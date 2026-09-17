import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import topics from "@seo/v1-examples/topics.json";
import { analysisRunKeys } from "@/entities/analysis-run";
import type { Article } from "@/entities/article";
import {
  getFeatures,
  importArticle,
  startAnalysis,
  type Features,
} from "../api/start-analysis.api";
import { startAnalysisSchema } from "../contract/start-analysis.contract";

export type Topic = (typeof topics)[number];

export type ArticleSlot = {
  url: string;
  article: Article | undefined;
  error: string;
};

export type AnalysisHint =
  "recommendations-disabled" | "with-competitors" | "without-competitors";

const contextFields = ["query", "audience", "purpose", "niche"] as const;

function emptySlot(url: string): ArticleSlot {
  return { url, article: undefined, error: "" };
}

function needsFetch(slot: ArticleSlot): boolean {
  return slot.url.trim() !== "" && !slot.article;
}

async function fetchSlot(slot: ArticleSlot): Promise<ArticleSlot> {
  if (!needsFetch(slot)) return slot;
  try {
    return {
      ...slot,
      article: await importArticle(slot.url.trim()),
      error: "",
    };
  } catch (err) {
    return {
      ...slot,
      error: err instanceof Error ? err.message : "Could not fetch the article",
    };
  }
}

function getHint(features: Features, competitors: ArticleSlot[]): AnalysisHint {
  if (!features.recommendations) return "recommendations-disabled";
  return competitors.some((slot) => slot.article)
    ? "with-competitors"
    : "without-competitors";
}

export function useNewAnalysis() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState<Topic>(topics[0]!);
  const [main, setMain] = useState<ArticleSlot>(emptySlot(""));
  const [competitors, setCompetitors] = useState<ArticleSlot[]>(
    topics[0]!.competitors.map(() => emptySlot("")),
  );
  const form = useForm({
    resolver: zodResolver(startAnalysisSchema),
    mode: "onTouched",
    defaultValues: {
      articleId: "",
      query: "",
      competitorIds: [],
      audience: "",
      purpose: "",
      niche: "",
    },
  });
  const featuresQuery = useQuery({
    queryKey: ["features"],
    queryFn: getFeatures,
  });
  const features = featuresQuery.data;
  const activeCompetitors = features?.recommendations ? competitors : [];

  const fetchMutation = useMutation({
    mutationFn: () => Promise.all([main, ...activeCompetitors].map(fetchSlot)),
    onSuccess: ([nextMain, ...nextActive]) =>
      applySlots(
        nextMain!,
        features?.recommendations ? nextActive : competitors,
      ),
  });

  const startMutation = useMutation({
    mutationFn: startAnalysis,
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: analysisRunKeys.all });
      navigate(`/analyses/${run.id}`);
    },
  });

  function applySlots(nextMain: ArticleSlot, nextCompetitors: ArticleSlot[]) {
    setMain(nextMain);
    setCompetitors(nextCompetitors);
    const options = { shouldValidate: form.formState.isSubmitted };
    form.setValue("articleId", nextMain.article?.id ?? "", options);
    const loaded = features?.recommendations ? nextCompetitors : [];
    form.setValue(
      "competitorIds",
      loaded.flatMap((slot) => (slot.article ? [slot.article.id] : [])),
      options,
    );
  }

  function resetContext() {
    for (const field of contextFields) form.setValue(field, "");
  }

  function selectTopic(next: Topic) {
    setTopic(next);
    applySlots(
      emptySlot(next.article.url),
      next.competitors.map((example) => emptySlot(example.url)),
    );
    resetContext();
  }

  function changeMainUrl(url: string) {
    const replacesExample = main.url === topic.article.url;
    applySlots(
      emptySlot(url),
      replacesExample ? competitors.map(() => emptySlot("")) : competitors,
    );
    resetContext();
  }

  function changeCompetitorUrl(index: number, url: string) {
    applySlots(
      main,
      competitors.map((slot, position) =>
        position === index ? emptySlot(url) : slot,
      ),
    );
  }

  const isFetching = fetchMutation.isPending;
  const isStarting = startMutation.isPending;

  return {
    features,
    featuresError: featuresQuery.error,
    topics,
    topic,
    selectTopic,
    main,
    changeMainUrl,
    competitors: activeCompetitors,
    changeCompetitorUrl,
    fetchArticles: () => fetchMutation.mutate(),
    canFetch:
      !isFetching &&
      !isStarting &&
      [main, ...activeCompetitors].some(needsFetch),
    isFetching,
    isStarting,
    hint: features && getHint(features, activeCompetitors),
    form,
    submit: form.handleSubmit((values) => startMutation.mutate(values)),
    startError: startMutation.error,
  };
}
