import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, test } from "node:test";

process.env.API_HOST = "127.0.0.1";
process.env.API_PORT = "3003";
process.env.WEB_ORIGIN = "http://localhost:5175";
process.env.REDIS_URL = "redis://127.0.0.1:6379/15";
process.env.DATABASE_URL =
  "postgresql://alekslog@127.0.0.1:5432/seo_v3?schema=public";

const SEARCH_QUERY = "handmade rugs";

const embeddings = createServer(async (request, response) => {
  let body = "";
  for await (const chunk of request) body += chunk;
  const payload = JSON.parse(body) as { model: string; input: string[] };
  response.setHeader("Content-Type", "application/json");
  response.end(
    JSON.stringify({
      object: "list",
      model: payload.model,
      data: payload.input.map((text, index) => ({
        object: "embedding",
        index,
        embedding: testEmbedding(text),
      })),
    }),
  );
});
await listen(embeddings);
process.env.LLM_BASE_URL = `${origin(embeddings)}/v1`;
process.env.LLM_API_KEY = "test";
process.env.LLM_EMBEDDING_MODEL = "test-embedding";

const { createApplication } = await import("./bootstrap.js");
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

after(async () => {
  await prisma.analysis.deleteMany({ where: { searchQuery: SEARCH_QUERY } });
  await prisma.$disconnect();
  await close(embeddings);
});

test("health boundary", async () => {
  const app = await createApplication();
  await app.listen(0, "127.0.0.1");
  const base = await app.getUrl();

  try {
    const response = await fetch(`${base}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  } finally {
    await app.close();
  }
});

test("analysis boundary scores every named page", async () => {
  const site = createServer((request, response) => {
    const path = new URL(request.url!, "http://site.test").pathname;
    if (path === "/broken") {
      response.statusCode = 503;
      response.end();
      return;
    }
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(`<!doctype html>
      <html><head><title>Rugs at ${path}</title></head><body><main><article>
        <h1>Handmade rugs</h1>
        <p>${`A guide to handmade wool rugs at ${path}, with materials, care, sizing and delivery. `.repeat(8)}</p>
        <p>${`Cleaning a wool rug at ${path} without shrinking the pile or fading the dye. `.repeat(8)}</p>
      </article></main></body></html>`);
  });
  await listen(site);

  const app = await createApplication();
  await app.listen(0, "127.0.0.1");
  const endpoint = `${await app.getUrl()}/api/analyses`;

  try {
    const invalid = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchQuery: SEARCH_QUERY,
        primaryUrl: "invalid",
        competitorUrls: [`${origin(site)}/rival`],
      }),
    });
    assert.equal(invalid.status, 400);

    const tooMany = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchQuery: SEARCH_QUERY,
        primaryUrl: `${origin(site)}/ours`,
        competitorUrls: Array.from(
          { length: 6 },
          (_, index) => `${origin(site)}/rival-${index}`,
        ),
      }),
    });
    assert.equal(tooMany.status, 400);

    const input = {
      searchQuery: SEARCH_QUERY,
      primaryUrl: `${origin(site)}/ours`,
      competitorUrls: [`${origin(site)}/first`, `${origin(site)}/second`],
    };
    const created = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    assert.equal(created.status, 201);
    const receipt = (await created.json()) as { id: string; status: string };
    assert.equal(receipt.status, "queued");

    let run: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const status = await fetch(`${endpoint}/${receipt.id}`);
      run = (await status.json()) as Record<string, unknown>;
      if (run.status === "completed" || run.status === "failed") break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(run?.status, "completed", JSON.stringify(run));

    const pages = run!.pages as Array<Record<string, unknown>>;
    assert.equal(pages.length, 3);
    assert.equal(pages[0]!.ours, true);
    assert.equal(pages[0]!.url, input.primaryUrl);
    assert.equal(pages[0]!.novelty, null);
    assert.equal(pages[0]!.priority, null);

    const rivals = pages.slice(1);
    assert.deepEqual(
      rivals.map((page) => page.url).toSorted(),
      input.competitorUrls.toSorted(),
    );
    for (const rival of rivals) {
      assert.equal(rival.ours, false);
      assert(Number.isFinite(rival.relevance as number));
      assert(Number.isFinite(rival.novelty as number));
      assert(Number.isFinite(rival.priority as number));
      assert((rival.fragmentCount as number) > 0);
    }
    assert(
      (rivals[0]!.priority as number) >= (rivals[1]!.priority as number),
      "rivals must be ordered by priority",
    );
  } finally {
    await app.close();
    await close(site);
  }
});

test("analysis boundary keeps going when one rival page is unreachable", async () => {
  const site = createServer((request, response) => {
    const path = new URL(request.url!, "http://site.test").pathname;
    if (path === "/broken") {
      response.statusCode = 503;
      response.end();
      return;
    }
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(`<!doctype html>
      <html><head><title>Rugs at ${path}</title></head><body><main><article>
        <h1>Handmade rugs</h1>
        <p>${`A guide to handmade wool rugs at ${path}, with materials, care, sizing and delivery. `.repeat(8)}</p>
      </article></main></body></html>`);
  });
  await listen(site);

  const app = await createApplication();
  await app.listen(0, "127.0.0.1");
  const endpoint = `${await app.getUrl()}/api/analyses`;

  try {
    const created = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchQuery: SEARCH_QUERY,
        primaryUrl: `${origin(site)}/ours`,
        competitorUrls: [`${origin(site)}/broken`, `${origin(site)}/alive`],
      }),
    });
    const { id } = (await created.json()) as { id: string };

    let run: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const status = await fetch(`${endpoint}/${id}`);
      run = (await status.json()) as Record<string, unknown>;
      if (run.status === "completed" || run.status === "failed") break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(run?.status, "completed", JSON.stringify(run));

    const pages = run!.pages as Array<Record<string, unknown>>;
    assert.equal(pages.length, 3);
    const broken = pages.find((page) =>
      (page.url as string).endsWith("/broken"),
    );
    assert.equal(broken?.status, "failed");
    assert.equal(broken?.reason, "unreachable");
    assert.match(broken?.detail as string, /503/);
    assert.equal(pages.at(-1)?.url, `${origin(site)}/broken`);
    assert.equal(
      pages.filter((page) => page.status === "scored").length,
      2,
      "our page and the reachable rival must still be scored",
    );
  } finally {
    await app.close();
    await close(site);
  }
});

test("analysis boundary fails when our own page is unreachable", async () => {
  const site = createServer((request, response) => {
    response.statusCode = 503;
    response.end();
  });
  await listen(site);

  const app = await createApplication();
  await app.listen(0, "127.0.0.1");
  const endpoint = `${await app.getUrl()}/api/analyses`;

  try {
    const created = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchQuery: SEARCH_QUERY,
        primaryUrl: `${origin(site)}/ours`,
        competitorUrls: [`${origin(site)}/rival`],
      }),
    });
    const { id } = (await created.json()) as { id: string };

    let run: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const status = await fetch(`${endpoint}/${id}`);
      run = (await status.json()) as Record<string, unknown>;
      if (run.status === "completed" || run.status === "failed") break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(run?.status, "failed", JSON.stringify(run));
    assert.equal(
      (run!.error as Record<string, unknown>).url,
      `${origin(site)}/ours`,
    );
  } finally {
    await app.close();
    await close(site);
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

function listen(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
}

function origin(server: ReturnType<typeof createServer>): string {
  const address = server.address();
  assert(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}

function close(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
