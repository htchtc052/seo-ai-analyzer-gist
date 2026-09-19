import assert from "node:assert/strict";
import { test } from "node:test";
import { ComparisonService } from "./comparison.service.js";

test("similarity keeps our paragraphs in rows and competitor paragraphs in columns", () => {
  const comparison = new ComparisonService();

  assert.deepEqual(
    comparison.similarity(
      [
        [1, 0],
        [0, 1],
      ],
      [
        [1, 0],
        [0, 1],
        [Math.SQRT1_2, Math.SQRT1_2],
      ],
    ),
    [
      [1, 0, 0.707],
      [0, 1, 0.707],
    ],
  );
});
