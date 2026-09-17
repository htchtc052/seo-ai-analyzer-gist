import { Inject, Injectable, Logger } from "@nestjs/common";
import { PageClientService } from "./page-client.service.js";

const MAX_FILES = 10;
const MAX_URLS = 5_000;
const ENTRY = /<(url|sitemap)\b[\s\S]*?<\/\1>/gi;
const LOCATION = /<loc>\s*([^<\s]+)\s*<\/loc>/i;
const LASTMOD = /<lastmod>\s*([^<\s]+)\s*<\/lastmod>/i;

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name);

  constructor(
    @Inject(PageClientService)
    private readonly client: PageClientService,
  ) {}

  async collect(
    origin: string,
    sitemaps: string[],
  ): Promise<Map<string, Date | null>> {
    const host = new URL(origin).hostname;
    const queue =
      sitemaps.length > 0 ? [...sitemaps] : [`${origin}/sitemap.xml`];
    const visited = new Set<string>();
    const urls = new Map<string, Date | null>();

    while (
      queue.length > 0 &&
      visited.size < MAX_FILES &&
      urls.size < MAX_URLS
    ) {
      const file = queue.shift()!;
      if (visited.has(file) || !file.endsWith(".xml")) continue;
      visited.add(file);

      for (const entry of await this.read(file)) {
        const sameHost = toSameOrigin(entry.url, origin, host);
        if (!sameHost) continue;
        if (sameHost.endsWith(".xml")) queue.push(sameHost);
        else urls.set(sameHost, entry.lastmod);
      }
    }

    this.logger.log(
      `${origin}: ${urls.size} urls from ${visited.size} sitemaps`,
    );
    return urls;
  }

  private async read(
    file: string,
  ): Promise<Array<{ url: string; lastmod: Date | null }>> {
    const body = await this.client.loadText(file).catch((error: Error) => {
      this.logger.warn(`Skipped sitemap ${file}: ${error.message}`);
      return "";
    });
    return [...body.matchAll(ENTRY)].flatMap((entry) => {
      const url = LOCATION.exec(entry[0])?.[1];
      if (!url) return [];
      return [{ url, lastmod: toDate(LASTMOD.exec(entry[0])?.[1]) }];
    });
  }
}

function toDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toSameOrigin(
  location: string,
  origin: string,
  host: string,
): string | null {
  try {
    const url = new URL(location);
    if (url.hostname !== host) return null;
    return `${origin.replace(/\/$/, "")}${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
