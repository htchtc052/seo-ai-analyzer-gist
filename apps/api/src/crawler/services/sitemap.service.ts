import { Inject, Injectable, Logger } from "@nestjs/common";
import { PageClientService } from "./page-client.service.js";

const MAX_FILES = 10;
const MAX_URLS = 5_000;
const LOCATION = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name);

  constructor(
    @Inject(PageClientService)
    private readonly client: PageClientService,
  ) {}

  async collect(origin: string, sitemaps: string[]): Promise<string[]> {
    const host = new URL(origin).hostname;
    const queue =
      sitemaps.length > 0 ? [...sitemaps] : [`${origin}/sitemap.xml`];
    const visited = new Set<string>();
    const urls = new Set<string>();

    while (
      queue.length > 0 &&
      visited.size < MAX_FILES &&
      urls.size < MAX_URLS
    ) {
      const file = queue.shift()!;
      if (visited.has(file) || !file.endsWith(".xml")) continue;
      visited.add(file);

      const locations = await this.read(file);
      for (const location of locations) {
        const sameHost = toSameOrigin(location, origin, host);
        if (!sameHost) continue;
        if (sameHost.endsWith(".xml")) queue.push(sameHost);
        else urls.add(sameHost);
      }
    }

    this.logger.log(
      `${origin}: ${urls.size} urls from ${visited.size} sitemaps`,
    );
    return [...urls];
  }

  private async read(file: string): Promise<string[]> {
    const body = await this.client.loadText(file).catch((error: Error) => {
      this.logger.warn(`Skipped sitemap ${file}: ${error.message}`);
      return "";
    });
    return [...body.matchAll(LOCATION)].map((match) => match[1]!);
  }
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
