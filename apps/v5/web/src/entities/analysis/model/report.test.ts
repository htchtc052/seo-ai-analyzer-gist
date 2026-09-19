import assert from "node:assert/strict";
import { test } from "node:test";
import type { CompletedRun } from "../contract.js";
import {
  createAnalysisReport,
  newnessChoices,
  selectIdeas,
} from "./report.js";

const run: CompletedRun = {
  id: "run-id",
  status: "completed",
  query: "query",
  model: "model",
  ours: {
    url: "https://ours.test",
    title: "Ours",
    paragraphs: [
      { heading: null, text: "Ours first", relevance: 0.1 },
      { heading: null, text: "Ours second", relevance: 0.2 },
    ],
  },
  competitors: [
    {
      url: "https://first.test",
      domain: "first.test",
      title: "First",
      paragraphs: [
        { heading: null, text: "First one", relevance: 0.3 },
        { heading: null, text: "First two", relevance: 0.4 },
      ],
      similarity: [
        [0.9, 0.2],
        [0.3, 0.8],
      ],
    },
    {
      url: "https://second.test",
      domain: "second.test",
      title: "Second",
      paragraphs: [{ heading: null, text: "Second one", relevance: 0.5 }],
      similarity: [[0.4], [0.7]],
    },
  ],
  failed: [],
};

test("calculates both directions and the median newness threshold from one matrix pass", () => {
  const report = createAnalysisReport(run);

  assert.equal(report.defaultNewnessThreshold.toFixed(1), "0.2");
  assert.deepEqual(
    report.ours.paragraphs.map((paragraph) => paragraph.match),
    [
      { competitorIndex: 0, paragraphIndex: 0, similarity: 0.9 },
      { competitorIndex: 0, paragraphIndex: 1, similarity: 0.8 },
    ],
  );
  assert.deepEqual(report.competitors[1]!.paragraphs[0]!.match, {
    oursIndex: 1,
    similarity: 0.7,
  });
});

test("selects relevant competitor paragraphs at the chosen newness threshold", () => {
  const report = createAnalysisReport(run);
  const choices = newnessChoices(report);

  assert.deepEqual(
    choices.map((value) => value.toFixed(1)),
    ["0.1", "0.1", "0.2", "0.2", "0.2", "0.2", "0.3"],
  );
  assert.deepEqual(
    selectIdeas(report, choices[3]!).map((idea) => idea.paragraph.text),
    ["Second one", "First two"],
  );
  assert.deepEqual(
    selectIdeas(report, choices[0]!).map((idea) => idea.paragraph.text),
    ["Second one", "First two", "First one"],
  );
});
