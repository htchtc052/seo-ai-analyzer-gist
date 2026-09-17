import { Download, LoaderCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { useNewAnalysis, type AnalysisHint } from "../model/useNewAnalysis";
import { ArticleField } from "./ArticleField";
import { ExampleTopic } from "./ExampleTopic";
import { Muted } from "@/shared/ui/typography";

const hints: Record<AnalysisHint, string> = {
  "recommendations-disabled":
    "Recommendations are disabled on this server, so the analysis calculates relevance scores only.",
  "with-competitors":
    "Scores are calculated right away. Recommendations against your competitors are written in the background and take about a minute.",
  "without-competitors":
    "Without competitors the analysis calculates relevance scores only. Fetch a competitor to also get recommendations.",
};

export function NewAnalysisForm() {
  const {
    features,
    featuresError,
    topics,
    topic,
    selectTopic,
    main,
    changeMainUrl,
    competitors,
    changeCompetitorUrl,
    fetchArticles,
    canFetch,
    isFetching,
    isStarting,
    hint,
    form,
    submit,
    startError,
  } = useNewAnalysis();
  const {
    register,
    formState: { errors },
  } = form;
  const locked = isFetching || isStarting;

  if (!features || !hint) {
    return featuresError ? (
      <Alert variant="destructive">
        <AlertDescription>{featuresError.message}</AlertDescription>
      </Alert>
    ) : (
      <Muted>Loading…</Muted>
    );
  }

  return (
    <form
      className="grid items-start gap-6 md:grid-cols-2"
      onSubmit={submit}
      noValidate
    >
      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <ArticleField
                label="Your article"
                slot={main}
                disabled={locked}
                onUrlChange={changeMainUrl}
              >
                <ExampleTopic
                  topics={topics}
                  topic={topic}
                  disabled={locked}
                  onSelect={selectTopic}
                />
              </ArticleField>
              <FieldError errors={[errors.articleId]} />
            </Field>
            {competitors.map((slot, index) => (
              <Field key={index}>
                <ArticleField
                  label={`Competitor ${index + 1} (optional)`}
                  slot={slot}
                  disabled={locked}
                  onUrlChange={(url) => changeCompetitorUrl(index, url)}
                />
              </Field>
            ))}
            {features.recommendations && (
              <FieldError errors={[errors.competitorIds]} />
            )}
            <Button type="button" disabled={!canFetch} onClick={fetchArticles}>
              {isFetching ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Download />
              )}
              {isFetching ? "Fetching…" : "Fetch articles"}
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.query)}>
              <FieldLabel htmlFor="query">Target query</FieldLabel>
              <Input
                id="query"
                {...register("query")}
                placeholder={`e.g. ${topic.query}`}
                aria-invalid={Boolean(errors.query)}
                disabled={isStarting}
              />
              <FieldError errors={[errors.query]} />
            </Field>
            <Field data-invalid={Boolean(errors.audience)}>
              <FieldLabel htmlFor="audience">Target audience</FieldLabel>
              <Textarea
                id="audience"
                {...register("audience")}
                placeholder="Who is reading? What do they already know?"
                aria-invalid={Boolean(errors.audience)}
                disabled={isStarting}
              />
              <FieldError errors={[errors.audience]} />
            </Field>
            <Field data-invalid={Boolean(errors.purpose)}>
              <FieldLabel htmlFor="purpose">Content purpose</FieldLabel>
              <Textarea
                id="purpose"
                {...register("purpose")}
                placeholder="What should the reader learn or do?"
                aria-invalid={Boolean(errors.purpose)}
                disabled={isStarting}
              />
              <FieldError errors={[errors.purpose]} />
            </Field>
            <Field data-invalid={Boolean(errors.niche)}>
              <FieldLabel htmlFor="niche">Website niche</FieldLabel>
              <Input
                id="niche"
                {...register("niche")}
                placeholder="e.g. Consumer technology news"
                aria-invalid={Boolean(errors.niche)}
                disabled={isStarting}
              />
              <FieldError errors={[errors.niche]} />
            </Field>
            <Field>
              <Button type="submit" disabled={locked}>
                {isStarting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
                {isStarting ? "Scoring…" : "Run analysis"}
              </Button>
              <FieldDescription>{hints[hint]}</FieldDescription>
            </Field>
            {startError && (
              <Alert variant="destructive">
                <AlertDescription>{startError.message}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>
        </CardContent>
      </Card>
    </form>
  );
}
