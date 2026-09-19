export type ExtractedSection = {
  heading: string | null;
  paragraphs: string[];
};

export type LoadedPage = {
  url: string;
  html: string;
};

export type ExtractedPage = {
  article: {
    title: string;
    sections: ExtractedSection[];
  } | null;
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
