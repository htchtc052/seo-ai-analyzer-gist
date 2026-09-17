-- CreateEnum
CREATE TYPE "ArticleRole" AS ENUM ('primary', 'competitor');

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "role" "ArticleRole" NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArticleCompetitors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArticleCompetitors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ArticleCompetitors_B_index" ON "_ArticleCompetitors"("B");

-- AddForeignKey
ALTER TABLE "_ArticleCompetitors" ADD CONSTRAINT "_ArticleCompetitors_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleCompetitors" ADD CONSTRAINT "_ArticleCompetitors_B_fkey" FOREIGN KEY ("B") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
