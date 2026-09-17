import assert from "node:assert/strict";
import { test } from "node:test";
import { analysisRunListSchema } from "./analysis/dto/analysis-run.dto.js";
import { createApplication } from "./bootstrap.js";

test("article import and analysis boundaries", async () => {
  const app = await createApplication();
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  const post = (path: string, body: unknown) =>
    fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  try {
    assert.equal(
      (await post("/articles/import", { url: "ftp://example.com/article" }))
        .status,
      400,
    );

    assert.equal((await fetch(`${base}/articles/missing`)).status, 404);

    const analysis = {
      articleId: "missing",
      query: "junior developer jobs",
      competitorIds: [],
      audience: "",
      purpose: "",
      niche: "",
    };
    assert.equal(
      (await post("/analyses", { ...analysis, query: "  " })).status,
      400,
    );
    assert.equal(
      (await post("/analyses", { ...analysis, competitorIds: ["a", "b", "c"] }))
        .status,
      400,
    );
    assert.equal(
      (await post("/analyses", { ...analysis, competitorIds: ["a", "a"] }))
        .status,
      400,
    );
    assert.equal((await post("/analyses", analysis)).status, 404);

    analysisRunListSchema.parse(await (await fetch(`${base}/analyses`)).json());
    assert.equal((await fetch(`${base}/analyses/missing`)).status, 404);
    assert.equal(
      (await fetch(`${base}/analyses/missing`, { method: "DELETE" })).status,
      404,
    );
  } finally {
    await app.close();
  }
});
