import { Link } from "react-router";
import { RecommendationStatus, useAnalysisRuns } from "@/entities/analysis-run";
import { DeleteRunButton } from "@/features/delete-analysis-run";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Muted } from "@/shared/ui/typography";

export function AnalysisRunsPage() {
  const { data: rows, error } = useAnalysisRuns();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyses</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        {!rows && !error && <Muted>Loading analyses…</Muted>}
        {rows?.length === 0 && (
          <Muted>
            No analyses yet.{" "}
            <Button asChild variant="link" className="p-0">
              <Link to="/">Start one</Link>
            </Button>
          </Muted>
        )}
        {rows && rows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Article</TableHead>
                <TableHead>Query</TableHead>
                <TableHead className="text-right">Relevance</TableHead>
                <TableHead>Result</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ run, status }) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <Button asChild variant="link" className="p-0">
                      <Link to={`/analyses/${run.id}`}>
                        {new Date(run.createdAt).toLocaleString()}
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {run.article.title}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {run.query}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {run.overallScore.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <RecommendationStatus status={status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {status !== "pending" && (
                      <DeleteRunButton
                        runId={run.id}
                        title={run.article.title}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
