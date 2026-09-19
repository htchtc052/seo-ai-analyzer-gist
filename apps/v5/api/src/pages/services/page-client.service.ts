import { Injectable } from "@nestjs/common";
import { setTimeout } from "node:timers/promises";
import { PageLoadError, type LoadedPage } from "../pages.types.js";

export const USER_AGENT =
  "SeoAiAnalyzerGistBot/0.1 (+https://github.com/seo-ai-analyzer-gist)";

const MAX_PAGE_BYTES = 5 * 1024 * 1024;
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

    return {
      url: response.url,
      html: await readBody(response, url, MAX_PAGE_BYTES, contentType),
    };
  }

  private async request(url: string, accept: string): Promise<Response> {
    let failure: Error | undefined;
    let response: Response | undefined;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await fetch(url, {
          redirect: "follow",
          headers: { "user-agent": USER_AGENT, accept },
          signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
        });
        break;
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        failure = error;
        if (attempt === 0) await setTimeout(500);
      }
    }

    if (!response) return loadFailed(failure!, url);

    if (response.status !== 200) {
      throw new PageLoadError(`Answered with HTTP ${response.status}`, url);
    }

    return response;
  }
}

async function readBody(
  response: Response,
  url: string,
  maxBytes: number,
  contentType: string,
): Promise<string> {
  if (Number(response.headers.get("content-length")) > maxBytes) {
    throw new PageLoadError(`Answered with more than ${maxBytes} bytes`, url);
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder(toCharset(contentType, url));
  let body = "";
  let bytes = 0;

  while (true) {
    const { done, value } = await reader
      .read()
      .catch((error: Error) => loadFailed(error, url));
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new PageLoadError(`Answered with more than ${maxBytes} bytes`, url);
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

function toCharset(contentType: string, url: string): string {
  const declared = /charset=\s*"?([\w-]+)/i.exec(contentType)?.[1];
  if (!declared) return "utf-8";
  try {
    return new TextDecoder(declared).encoding;
  } catch {
    throw new PageLoadError(`Answered in unsupported charset ${declared}`, url);
  }
}
