-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "selectionDiversity" DOUBLE PRECISION,
ADD COLUMN     "selectionObjective" DOUBLE PRECISION,
ADD COLUMN     "selectionUtility" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Fragment" ADD COLUMN     "selectedRank" INTEGER;

