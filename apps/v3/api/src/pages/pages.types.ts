export type ExtractedSection = {
  heading: string | null;
  paragraphs: string[];
};

export type PageDate = { date: Date; source: string } | null;

export type PageLink = {
  url: string;
  text: string;
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

export class EmptyPageError extends Error {
  constructor(
    message: string,
    readonly url: string,
  ) {
    super(message);
  }
}
