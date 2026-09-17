import { Link, useParams } from "react-router";
import {
  AnalysisRunInputs,
  RecommendationStatus,
  ScoreChart,
  useAnalysisRun,
} from "@/entities/analysis-run";
import { ExternalLink } from "@/shared/ui/external-link";
import { TextList } from "@/shared/ui/text-list";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Muted, SectionTitle } from "@/shared/ui/typography";

export function AnalysisRunPage() {
  const { id = "" } = useParams();
  const { data, error } = useAnalysisRun(id);

  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  if (!data) return <Muted>Loading analysis…</Muted>;

  const { run, status: recommendationStatus } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          <ExternalLink href={run.article.sourceUrl}>
            {run.article.title}
          </ExternalLink>
        </CardTitle>
        <CardAction>
          <RecommendationStatus status={recommendationStatus} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-8">
        <AnalysisRunInputs run={run} />
        <section className="grid gap-4">
          <SectionTitle>
            Overall relevance:{" "}
            <span className="text-primary tabular-nums">
              {run.overallScore.toFixed(2)}
            </span>
          </SectionTitle>
          <ScoreChart fragments={run.fragments} />
        </section>
        {recommendationStatus === "scores-only" && (
          <Muted>
            No competitors were added, so recommendations were not requested.
          </Muted>
        )}
        {recommendationStatus === "failed" && (
          <Alert variant="destructive">
            <AlertDescription>
              {run.recommendationJob?.failedReason ??
                "The recommendation job is no longer available."}
            </AlertDescription>
          </Alert>
        )}
        {recommendationStatus === "ready" && (
          <>
            {run.missingEntities.length > 0 && (
              <TextList
                title="Suggested missing topics"
                items={run.missingEntities}
              />
            )}
            <TextList title="Recommendations" items={run.recommendations} />
          </>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/analyses">All analyses</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/">New analysis</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
