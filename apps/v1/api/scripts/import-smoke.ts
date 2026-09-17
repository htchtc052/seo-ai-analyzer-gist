import topics from "@seo/v1-examples/topics.json" with { type: "json" };

const api = process.env.SMOKE_API_URL ?? "http://127.0.0.1:3001/api";

const manifest = {
  succeeds: topics.flatMap((topic) =>
    [topic.article, ...topic.competitors].map((example) => example.url),
  ),
  fails: [
    "https://www.dpreview.com/news/one-of-the-new-iphone-18-pros-includes-a-new-camera-trick-a-moving-aperture/",
    "https://www.phonearena.com/news/iphone-18-pro-dynamic-island-a20-pro-n2-c2-variable-aperture_id178248",
    "https://medium.com/@kantmusk/the-companies-quietly-hiring-junior-developers-in-2026-while-everyone-else-panics-about-ai-e13028a78d25",
    "https://codeconductor.ai/blog/future-of-junior-developers-ai/",
    "https://www.apple.com/newsroom/images/2026/09/apple-debuts-iphone-18-pro-and-iphone-18-pro-max/article/Apple-iPhone-18-Pro-2up-260909_inline.jpg.large.jpg",
    "https://ballotpedia.org/United_States_Congress_elections,_2026",
    "http://127.0.0.1:5433/",
    "https://semantic-relevance-smoke.invalid/article",
  ],
};

let mismatches = 0;

for (const [expected, urls] of Object.entries(manifest)) {
  for (const url of urls) {
    const response = await fetch(`${api}/articles/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const body = (await response.json()) as {
      article?: { title: string; sections: { paragraphs: string[] }[] };
      error?: { message: string };
    };
    const succeeded = response.ok;
    const ok = succeeded === (expected === "succeeds");
    if (!ok) mismatches++;
    const detail = body.article
      ? `${body.article.sections.flatMap((section) => section.paragraphs).join(" ").length} chars · ${body.article.title}`
      : body.error?.message;
    console.log(
      `${ok ? "ok  " : "FAIL"} ${expected.padEnd(8)} ${response.status} ${url}\n      ${detail}`,
    );
  }
}

console.log(
  mismatches === 0
    ? "\nAll import expectations met"
    : `\n${mismatches} import expectation(s) not met`,
);
process.exitCode = mismatches === 0 ? 0 : 1;
