import assert from "node:assert/strict";
import { test } from "node:test";
import { ContentExtractorService } from "./content-extractor.service.js";

test("does not expose preformatted code as an article paragraph", () => {
  const text =
    "Robots.txt tells search engines which parts of a site they may crawl and which pages they should skip. It keeps technical sections out of search results without changing the page content for visitors.";
  const code =
    "<urlset><url><loc>https://example.com/</loc></url><url><loc>https://example.com/catalog/</loc></url></urlset>";
  const extractor = new ContentExtractorService();

  const result = extractor.extract(`
    <!doctype html>
    <html>
      <head><title>Robots guide</title></head>
      <body>
        <article>
          <h2>Robots.txt</h2>
          <p>${text}</p>
          <pre><code>${code}</code></pre>
        </article>
      </body>
    </html>
  `);

  const paragraphs = result.article?.sections.flatMap(
    (section) => section.paragraphs,
  );
  assert.deepEqual(paragraphs, [text]);
});
