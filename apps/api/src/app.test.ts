import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, test } from "node:test";

process.env.API_HOST = "127.0.0.1";
process.env.API_PORT = "3001";
process.env.WEB_ORIGIN = "http://localhost:5173";
process.env.REDIS_URL = "redis://127.0.0.1:6380/1";
process.env.DATABASE_URL =
  "postgresql://seo_ai_analyzer_gist:seo_ai_analyzer_gist@127.0.0.1:5434/seo_ai_analyzer_gist?schema=public";

const embeddings = createServer(async (request, response) => {
  let body = "";
  for await (const chunk of request) body += chunk;
  const payload = JSON.parse(body) as { model: string; input: string[] };
  response.setHeader("Content-Type", "application/json");
  response.end(
    JSON.stringify({
      object: "list",
      model: payload.model,
      data: payload.input
        .map((text, index) => ({
          object: "embedding",
          index,
          embedding: testEmbedding(text),
        }))
        .toReversed(),
      usage: {
        prompt_tokens: payload.input.length,
        total_tokens: payload.input.length,
      },
    }),
  );
});
await new Promise<void>((resolve) =>
  embeddings.listen(0, "127.0.0.1", resolve),
);
const embeddingsAddress = embeddings.address();
assert(embeddingsAddress && typeof embeddingsAddress !== "string");
process.env.LLM_BASE_URL = `http://127.0.0.1:${embeddingsAddress.port}/v1`;
process.env.LLM_API_KEY = "test";
process.env.LLM_EMBEDDING_MODEL = "test-embedding";

const { createApplication } = await import("./bootstrap.js");
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

after(async () => {
  await prisma.analysis.deleteMany({
    where: { searchQuery: "handmade rugs" },
  });
  await prisma.$disconnect();
  await close(embeddings);
});

test("health boundary", async () => {
  const app = await createApplication();
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address();
  assert(address && typeof address !== "string");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  } finally {
    await app.close();
  }
});

test("analysis boundary", async () => {
  const site = createServer((request, response) => {
    if (request.url === "/catalog") {
      response.statusCode = 302;
      response.setHeader("Location", "/catalog-main");
      response.end();
      return;
    }
    const path = new URL(request.url!, "http://site.test").pathname;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(`<!doctype html>
      <html><head><title>${path}</title></head><body><main><article>
        <h1>Handmade rugs</h1>
        <p>${`A guide to handmade wool rugs at ${path}, with materials, care, sizing and delivery. `.repeat(8)}</p>
        <a href="/catalog">Current page</a>
        <a href="/catalog/collection?language=en">Collection</a>
        <a href="/catalog/collection?language=de">Collection duplicate</a>
        <a href="/outside">Outside section</a>
      </article></main></body></html>`);
  });
  await new Promise<void>((resolve) => site.listen(0, "127.0.0.1", resolve));
  const siteAddress = site.address();
  assert(siteAddress && typeof siteAddress !== "string");
  const siteUrl = `http://127.0.0.1:${siteAddress.port}/catalog/`;

  const app = await createApplication();
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address();
  assert(address && typeof address !== "string");
  const endpoint = `http://127.0.0.1:${address.port}/api/analyses`;

  try {
    const invalid = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchQuery: "handmade rugs",
        primarySiteUrl: "invalid",
        competitorSiteUrl: "https://example.com",
        crawlPagesPerSite: 6,
      }),
    });
    assert.equal(invalid.status, 400);

    const input = {
      searchQuery: "handmade rugs",
      primarySiteUrl: siteUrl,
      competitorSiteUrl: siteUrl,
      crawlPagesPerSite: 6,
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    assert.equal(response.status, 201);
    const receipt = (await response.json()) as {
      id: string;
      status: string;
    };
    assert.equal(receipt.status, "queued");

    let run: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const status = await fetch(`${endpoint}/${receipt.id}`);
      run = (await status.json()) as Record<string, unknown>;
      if (run.status === "completed") break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(run?.status, "completed");

    const stored = await prisma.analysis.findUniqueOrThrow({
      where: { id: receipt.id },
      include: {
        pages: {
          include: { fragments: true },
          orderBy: [{ source: "asc" }, { position: "asc" }],
        },
      },
    });
    assert.equal(stored.status, "COMPLETED");
    assert.equal(stored.searchQuery, input.searchQuery);
    assert.equal(stored.primarySiteUrl, `${new URL(siteUrl).origin}/`);
    assert.equal(stored.competitorSiteUrl, `${new URL(siteUrl).origin}/`);
    assert.equal(stored.crawlPagesPerSite, input.crawlPagesPerSite);
    assert.equal(stored.pages.length, 4);
    assert(stored.crawledPages >= stored.pages.length);
    assert(stored.pages.every((page) => page.embeddedAt instanceof Date));
    const primary = stored.pages.filter((page) => page.source === "PRIMARY");
    const competitor = stored.pages.filter(
      (page) => page.source === "COMPETITOR",
    );
    const sources = { primary, competitor };
    for (const source of [sources.primary, sources.competitor]) {
      assert.equal(source.length, 2);
      assert(
        source.every(
          (page) => new URL(page.url).origin === new URL(siteUrl).origin,
        ),
      );
      assert.equal(new Set(source.map((page) => page.url)).size, source.length);
      assert(
        source.some((page) => new URL(page.url).pathname === "/catalog-main"),
      );
      assert(
        source.filter(
          (page) => new URL(page.url).pathname === "/catalog/collection",
        ).length <= 1,
      );
    }
    assert.equal(stored.embeddingModel, "test-embedding");
    assert(
      primary.every((page) =>
        page.fragments.every(
          (fragment) =>
            Number.isFinite(fragment.relevance) &&
            fragment.embedding.length > 0,
        ),
      ),
    );
    assert(
      competitor.every((page) =>
        page.fragments.every(
          (fragment) =>
            Number.isFinite(fragment.relevance) &&
            Math.abs(fragment.maxPrimarySimilarity! - 1) < 1e-12 &&
            Boolean(fragment.closestPrimaryFragmentId),
        ),
      ),
    );
  } finally {
    await app.close();
    await close(site);
  }
});

test("embeddings boundary rejects broken provider batches", async () => {
  let served = 0;
  const provider = createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    const input = (JSON.parse(body) as { input: string[] }).input;
    served += 1;
    const vectors =
      served === 2
        ? [input[0]!, ...input.slice(0, -1)].map(testEmbedding)
        : input.map(testEmbedding);
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        object: "list",
        data: vectors.map((embedding, index) => ({
          object: "embedding",
          index: served === 1 && index === 1 ? 0 : index,
          embedding,
        })),
      }),
    );
  });
  await new Promise<void>((resolve) =>
    provider.listen(0, "127.0.0.1", resolve),
  );
  const providerAddress = provider.address();
  assert(providerAddress && typeof providerAddress !== "string");

  const { EmbeddingsService } =
    await import("./embeddings/services/embeddings.service.js");
  const settings: Record<string, string> = {
    LLM_BASE_URL: `http://127.0.0.1:${providerAddress.port}/v1`,
    LLM_API_KEY: "test",
    LLM_EMBEDDING_MODEL: "test-embedding",
  };
  const embeddings = new EmbeddingsService({
    get: (key: string) => settings[key]!,
  } as never);

  try {
    const texts = ["alpha", "beta", "gamma"];
    const result = await embeddings.embed(texts);
    assert.equal(served, 3);
    assert.deepEqual(result, texts.map(testEmbedding));
  } finally {
    await close(provider);
  }
});

function testEmbedding(text: string): number[] {
  let seed = 7;
  for (const character of text)
    seed = (seed * 31 + character.charCodeAt(0)) % 2_147_483_647;
  return Array.from({ length: 8 }, () => {
    seed = (seed * 48_271) % 2_147_483_647;
    return seed / 2_147_483_647;
  });
}

function close(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
