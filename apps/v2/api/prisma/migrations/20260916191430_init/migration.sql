-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('QUEUED', 'CRAWLING', 'CRAWLED', 'ANALYZING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PageSource" AS ENUM ('PRIMARY', 'COMPETITOR');

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "primarySiteUrl" TEXT NOT NULL,
    "competitorSiteUrl" TEXT NOT NULL,
    "maxPagesPerSite" INTEGER NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'QUEUED',
    "embeddingModel" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisPage" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "source" "PageSource" NOT NULL,
    "position" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "embeddedAt" TIMESTAMP(3),

    CONSTRAINT "AnalysisPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fragment" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "sectionIndex" INTEGER NOT NULL,
    "paragraphIndex" INTEGER NOT NULL,
    "heading" TEXT,
    "text" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "relevance" DOUBLE PRECISION,
    "maxPrimarySimilarity" DOUBLE PRECISION,
    "closestPrimaryFragmentId" TEXT,

    CONSTRAINT "Fragment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analysis_createdAt_idx" ON "Analysis"("createdAt");

-- CreateIndex
CREATE INDEX "Analysis_status_idx" ON "Analysis"("status");

-- CreateIndex
CREATE INDEX "AnalysisPage_analysisId_idx" ON "AnalysisPage"("analysisId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisPage_analysisId_source_position_key" ON "AnalysisPage"("analysisId", "source", "position");

-- CreateIndex
CREATE INDEX "Fragment_pageId_idx" ON "Fragment"("pageId");

-- CreateIndex
CREATE INDEX "Fragment_closestPrimaryFragmentId_idx" ON "Fragment"("closestPrimaryFragmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Fragment_pageId_sectionIndex_paragraphIndex_key" ON "Fragment"("pageId", "sectionIndex", "paragraphIndex");

-- AddForeignKey
ALTER TABLE "AnalysisPage" ADD CONSTRAINT "AnalysisPage_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fragment" ADD CONSTRAINT "Fragment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "AnalysisPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fragment" ADD CONSTRAINT "Fragment_closestPrimaryFragmentId_fkey" FOREIGN KEY ("closestPrimaryFragmentId") REFERENCES "Fragment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
