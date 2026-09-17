CREATE TYPE "FailureSite" AS ENUM ('PRIMARY', 'COMPETITOR');

CREATE TYPE "FailureReason" AS ENUM ('UNREACHABLE', 'EMPTY', 'INTERNAL');

ALTER TABLE "Analysis"
  DROP COLUMN "error",
  ADD COLUMN "failureSite" "FailureSite",
  ADD COLUMN "failureReason" "FailureReason";
