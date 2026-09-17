-- CreateEnum
CREATE TYPE "PageSource" AS ENUM ('PRIMARY', 'COMPETITOR');

-- CreateEnum
CREATE TYPE "FailureReason" AS ENUM ('UNREACHABLE', 'EMPTY', 'INTERNAL');

-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "competitorUrls",
DROP COLUMN "primaryUrl",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "embeddingModel" TEXT,
ADD COLUMN     "failureDetail" TEXT,
ADD COLUMN     "failureReason" "FailureReason",
ADD COLUMN     "failureUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "AnalysisPage" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "source" "PageSource" NOT NULL,
    "position" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
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
    "similarity" DOUBLE PRECISION,

    CONSTRAINT "Fragment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisPage_analysisId_idx" ON "AnalysisPage"("analysisId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisPage_analysisId_source_position_key" ON "AnalysisPage"("analysisId", "source", "position");

-- CreateIndex
CREATE INDEX "Fragment_pageId_idx" ON "Fragment"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "Fragment_pageId_sectionIndex_paragraphIndex_key" ON "Fragment"("pageId", "sectionIndex", "paragraphIndex");

-- AddForeignKey
ALTER TABLE "AnalysisPage" ADD CONSTRAINT "AnalysisPage_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fragment" ADD CONSTRAINT "Fragment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "AnalysisPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

