import assert from "node:assert/strict";
import { test } from "node:test";

process.env.API_HOST = "127.0.0.1";
process.env.API_PORT = "3003";
process.env.WEB_ORIGIN = "http://localhost:5175";
process.env.REDIS_URL = "redis://127.0.0.1:6379/15";
process.env.DATABASE_URL =
  "postgresql://alekslog@127.0.0.1:5432/seo_v3?schema=public";
process.env.LLM_BASE_URL = "http://127.0.0.1:1/v1";
process.env.LLM_API_KEY = "test";
process.env.LLM_EMBEDDING_MODEL = "test";

const { createApplication } = await import("./bootstrap.js");
const app = await createApplication();
const server = app.getHttpServer();
await app.listen(0, "127.0.0.1");
const base = await app.getUrl();

test.after(async () => {
  await app.close();
});

test("health boundary", async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.ok(server);
});

test("analysis boundary keeps the query, our page and the rivals", async () => {
  const input = {
    searchQuery: "запрос",
    primaryUrl: "https://ours.test/article",
    competitorUrls: ["https://one.test/a", "https://two.test/b"],
  };

  const created = await fetch(`${base}/api/analyses`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  assert.equal(created.status, 201);
  const { id } = (await created.json()) as { id: string };

  const found = await fetch(`${base}/api/analyses/${id}`);
  assert.equal(found.status, 200);
  const { createdAt, ...run } = (await found.json()) as Record<string, unknown>;
  assert.deepEqual(run, {
    id,
    searchQuery: input.searchQuery,
    primaryUrl: input.primaryUrl,
    competitorUrls: input.competitorUrls,
    competitorCount: 2,
    status: "queued",
  });
  assert.ok(
    typeof createdAt === "string" && !Number.isNaN(Date.parse(createdAt)),
  );

  const removed = await fetch(`${base}/api/analyses/${id}`, {
    method: "DELETE",
  });
  assert.equal(removed.status, 204);
});

test("analysis boundary rejects more than five rivals", async () => {
  const response = await fetch(`${base}/api/analyses`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      searchQuery: "запрос",
      primaryUrl: "https://ours.test/article",
      competitorUrls: Array.from(
        { length: 6 },
        (_, index) => `https://rival.test/${index}`,
      ),
    }),
  });
  assert.equal(response.status, 400);
});
