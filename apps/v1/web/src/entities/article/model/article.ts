export type ArticleSection = {
  heading: string | null;
  paragraphs: string[];
};

export type Article = {
  id: string;
  sourceUrl: string;
  title: string;
  sections: ArticleSection[];
  importedAt: string;
};

export type ArticleRef = Pick<Article, "id" | "sourceUrl" | "title">;
