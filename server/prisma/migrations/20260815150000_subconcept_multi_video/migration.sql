-- Revert the fixed mainVideo/previewVideo slots — SubConcepts get a real
-- one-to-many Video relation again, since multiple teachers each attach their
-- own video to the same (admin/seed-only) Sub-concept slot.

ALTER TABLE "SubConcept" DROP COLUMN "mainVideo";
ALTER TABLE "SubConcept" DROP COLUMN "previewVideo";

CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "subConceptId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "creatorName" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Video_subConceptId_isPrimary_idx" ON "Video"("subConceptId", "isPrimary");

ALTER TABLE "Video" ADD CONSTRAINT "Video_subConceptId_fkey" FOREIGN KEY ("subConceptId") REFERENCES "SubConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Pre-launch dev data only — safe to clear rather than backfill a videoId
-- that has no real source of truth anymore.
DELETE FROM "Attempt";
DELETE FROM "WatchEvent";

ALTER TABLE "Attempt" ADD COLUMN "videoId" TEXT NOT NULL;
DROP INDEX "Attempt_subConceptId_passed_idx";
CREATE INDEX "Attempt_subConceptId_videoId_passed_idx" ON "Attempt"("subConceptId", "videoId", "passed");
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WatchEvent" DROP CONSTRAINT "WatchEvent_subConceptId_fkey";
DROP INDEX "WatchEvent_subConceptId_idx";
ALTER TABLE "WatchEvent" DROP COLUMN "subConceptId";
ALTER TABLE "WatchEvent" DROP COLUMN "videoSlot";
DROP TYPE "VideoSlot";

ALTER TABLE "WatchEvent" ADD COLUMN "videoId" TEXT NOT NULL;
CREATE INDEX "WatchEvent_videoId_idx" ON "WatchEvent"("videoId");
ALTER TABLE "WatchEvent" ADD CONSTRAINT "WatchEvent_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
