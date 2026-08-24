-- Drop FKs/columns that reference Video, then the Video table itself.
ALTER TABLE "Attempt" DROP CONSTRAINT "Attempt_videoId_fkey";
DROP INDEX "Attempt_subConceptId_videoId_passed_idx";
ALTER TABLE "Attempt" DROP COLUMN "videoId";
CREATE INDEX "Attempt_subConceptId_passed_idx" ON "Attempt"("subConceptId", "passed");

ALTER TABLE "WatchEvent" DROP CONSTRAINT "WatchEvent_videoId_fkey";
DROP INDEX "WatchEvent_videoId_idx";
ALTER TABLE "WatchEvent" DROP COLUMN "videoId";

-- Pre-launch dev data only (no real watch events have ever been recorded
-- against a running deployment) — safe to clear rather than backfill.
DELETE FROM "WatchEvent";

CREATE TYPE "VideoSlot" AS ENUM ('MAIN', 'PREVIEW');

ALTER TABLE "WatchEvent" ADD COLUMN "subConceptId" TEXT NOT NULL;
ALTER TABLE "WatchEvent" ADD COLUMN "videoSlot" "VideoSlot" NOT NULL;
ALTER TABLE "WatchEvent" ADD CONSTRAINT "WatchEvent_subConceptId_fkey" FOREIGN KEY ("subConceptId") REFERENCES "SubConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "WatchEvent_subConceptId_idx" ON "WatchEvent"("subConceptId");

DROP TABLE "Video";

-- SubConcept gains the two fixed video slots directly.
ALTER TABLE "SubConcept" ADD COLUMN "mainVideo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SubConcept" ALTER COLUMN "mainVideo" DROP DEFAULT;
ALTER TABLE "SubConcept" ADD COLUMN "previewVideo" TEXT;

-- PracticeQuestion -> Test rename.
ALTER TABLE "PracticeQuestion" RENAME TO "Test";
ALTER TABLE "Test" RENAME CONSTRAINT "PracticeQuestion_pkey" TO "Test_pkey";
ALTER TABLE "Test" RENAME CONSTRAINT "PracticeQuestion_subConceptId_fkey" TO "Test_subConceptId_fkey";
