import type {
  CrawledSite,
  ExtractedSection,
} from "../../crawler/crawler.types.js";
import type { AnalysisInputDto } from "./analysis-input.schema.js";

export type AnalysisReceipt = { id: string; status: "queued" };
export type AnalysisFailure =
  | {
      site: "primary" | "competitor";
      reason: "unreachable" | "empty";
      url: string;
      detail: string;
    }
  | { site: null; reason: "internal" };
export type CrawledSources = {
  primary: CrawledSite;
  competitor: CrawledSite;
};

export type ReportPage = {
  url: string;
  title: string;
  pageDate: string | null;
  pageDateSource: string | null;
  sitemapLastmod: string | null;
  sections: ExtractedSection[];
};

export type ReportSources = {
  primary: { startUrl: string; pages: ReportPage[] };
  competitor: { startUrl: string; pages: ReportPage[] };
};
export type FragmentRef = {
  pageIndex: number;
  sectionIndex: number;
  paragraphIndex: number;
};
export type SemanticReport = {
  model: string;
  primary: Array<{ ref: FragmentRef; relevance: number }>;
  competitor: Array<{
    ref: FragmentRef;
    relevance: number;
    maxPrimarySimilarity: number;
    closestPrimaryRef: FragmentRef;
  }>;
};

export type SemanticFragmentInput = {
  id: string;
  heading: string | null;
  text: string;
};

export type EmbeddedFragment = {
  id: string;
  embedding: number[];
  relevance: number;
};

export type FragmentComparison = {
  fragmentId: string;
  maxPrimarySimilarity: number;
  closestPrimaryFragmentId: string;
};

type AnalysisBase = AnalysisInputDto & {
  id: string;
  createdAt: string;
};

export type AnalysisProgress = { done: number; total: number | null };

export type AnalysisRun =
  | (AnalysisBase & { status: "queued" })
  | (AnalysisBase & { status: "crawling"; progress: AnalysisProgress })
  | (AnalysisBase & {
      status: "crawled" | "analyzing";
      sources: ReportSources;
      progress: AnalysisProgress;
    })
  | (AnalysisBase & {
      status: "completed";
      sources: ReportSources;
      semantic: SemanticReport;
    })
  | (AnalysisBase & {
      status: "failed";
      sources?: ReportSources;
      error: AnalysisFailure;
    });

export type AnalysisSummary = {
  id: string;
  searchQuery: string;
  status: AnalysisRun["status"];
  pageCount: number;
  createdAt: string;
};

export type { CrawledSite };
