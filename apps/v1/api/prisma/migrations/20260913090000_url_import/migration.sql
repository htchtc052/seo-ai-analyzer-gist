DELETE FROM "AnalysisRun";
DELETE FROM "Article";

-- DropForeignKey
ALTER TABLE "AnalysisRun" DROP CONSTRAINT "AnalysisRun_articleId_fkey";

-- DropForeignKey
ALTER TABLE "_ArticleCompetitors" DROP CONSTRAINT "_ArticleCompetitors_A_fkey";

-- DropForeignKey
ALTER TABLE "_ArticleCompetitors" DROP CONSTRAINT "_ArticleCompetitors_B_fkey";

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "role",
DROP COLUMN "topic",
ADD COLUMN     "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sections" JSONB NOT NULL,
ADD COLUMN     "sourceUrl" TEXT NOT NULL;

-- DropTable
DROP TABLE "_ArticleCompetitors";

-- DropEnum
DROP TYPE "ArticleRole";

-- CreateTable
CREATE TABLE "_RunCompetitors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RunCompetitors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RunCompetitors_B_index" ON "_RunCompetitors"("B");

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RunCompetitors" ADD CONSTRAINT "_RunCompetitors_A_fkey" FOREIGN KEY ("A") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RunCompetitors" ADD CONSTRAINT "_RunCompetitors_B_fkey" FOREIGN KEY ("B") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

