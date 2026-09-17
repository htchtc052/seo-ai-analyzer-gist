export type ExtractedSection = {
  heading: string | null;
  paragraphs: string[];
};

export type PageDate = { date: Date; source: string } | null;

export type PageLink = {
  url: string;
  text: string;
};

export type CrawledPage = {
  url: string;
  title: string;
  pageDate: PageDate;
  sitemapLastmod: Date | null;
  sections: ExtractedSection[];
};

export type CrawledSite = {
  startUrl: string;
  pages: CrawledPage[];
};

export type LoadedPage = {
  url: string;
  html: string;
};

export type ExtractedPage = {
  article: {
    title: string;
    publishedAt: PageDate;
    sections: ExtractedSection[];
  } | null;
  links: PageLink[];
};

export class PageLoadError extends Error {
  constructor(
    message: string,
    readonly url: string,
  ) {
    super(message);
  }
}

export class EmptySiteError extends Error {
  constructor(
    message: string,
    readonly url: string,
  ) {
    super(message);
  }
}
