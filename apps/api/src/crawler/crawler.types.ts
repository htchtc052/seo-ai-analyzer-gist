export type ExtractedSection = {
  heading: string | null;
  paragraphs: string[];
};

export type PageLink = {
  url: string;
  text: string;
};

export type CrawledPage = {
  url: string;
  title: string;
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
  article: { title: string; sections: ExtractedSection[] } | null;
  links: PageLink[];
};

export class PageLoadError extends Error {}
export class EmptySiteError extends Error {}
