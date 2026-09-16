import { Injectable } from "@nestjs/common";
import { PageLoadError, type LoadedPage } from "../crawler.types.js";

export const CRAWLER_USER_AGENT =
  "SeoAiAnalyzerGistBot/0.1 (+https://github.com/seo-ai-analyzer-gist)";

const MAX_BYTES = 5 * 1024 * 1024;
const PAGE_TIMEOUT_MS = 10_000;

@Injectable()
export class PageClientService {
  async load(url: string): Promise<LoadedPage> {
    const response = await this.request(url, "text/html,application/xhtml+xml");

    const contentType = response.headers.get("content-type") ?? "";
    if (!/^(text\/html|application\/xhtml\+xml)\b/i.test(contentType)) {
      throw new PageLoadError(
        `Answered with ${contentType || "no"} content type`,
        url,
      );
    }

    return { url: response.url, html: await readBody(response, url) };
  }

  async loadText(url: string): Promise<string> {
    return readBody(await this.request(url, "text/plain"), url);
  }

  private async request(url: string, accept: string): Promise<Response> {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": CRAWLER_USER_AGENT, accept },
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    }).catch((error: Error) => loadFailed(error, url));

    if (response.status !== 200) {
      throw new PageLoadError(`Answered with HTTP ${response.status}`, url);
    }

    return response;
  }
}

async function readBody(response: Response, url: string): Promise<string> {
  if (Number(response.headers.get("content-length")) > MAX_BYTES) {
    throw new PageLoadError("Answered with more than 5 MB", url);
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let bytes = 0;

  while (true) {
    const { done, value } = await reader
      .read()
      .catch((error: Error) => loadFailed(error, url));
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BYTES) {
      await reader.cancel();
      throw new PageLoadError("Answered with more than 5 MB", url);
    }
    body += decoder.decode(value, { stream: true });
  }

  return body + decoder.decode();
}

function loadFailed(error: Error, url: string): never {
  const cause =
    error.cause instanceof Error ? error.cause.message : error.message;
  throw new PageLoadError(cause, url);
}
