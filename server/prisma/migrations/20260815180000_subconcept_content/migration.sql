-- Video -> SubConceptContent: broaden from a single URL to a full per-teacher
-- bundle (video + previewVideo + description), and move Test underneath it
-- since each teacher's tasks belong to their own submission, not the slot.

ALTER TABLE "Video" RENAME TO "SubConceptContent";
ALTER TABLE "SubConceptContent" RENAME COLUMN "url" TO "video";
ALTER TABLE "SubConceptContent" ADD COLUMN "previewVideo" TEXT;
ALTER TABLE "SubConceptContent" ADD COLUMN "description" TEXT;
ALTER TABLE "SubConceptContent" RENAME CONSTRAINT "Video_pkey" TO "SubConceptContent_pkey";
ALTER TABLE "SubConceptContent" RENAME CONSTRAINT "Video_subConceptId_fkey" TO "SubConceptContent_subConceptId_fkey";
ALTER INDEX "Video_subConceptId_isPrimary_idx" RENAME TO "SubConceptContent_subConceptId_isPrimary_idx";

-- Test.subConceptId -> Test.contentId (now points at SubConceptContent, not
-- SubConcept). Pre-launch dev data only — clear rather than trying to backfill
-- against newly-scoped content ids.
DELETE FROM "Test";
ALTER TABLE "Test" DROP CONSTRAINT "Test_subConceptId_fkey";
ALTER TABLE "Test" RENAME COLUMN "subConceptId" TO "contentId";
ALTER TABLE "Test" ADD CONSTRAINT "Test_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "SubConceptContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Attempt.videoId -> Attempt.contentId
DELETE FROM "Attempt";
ALTER TABLE "Attempt" DROP CONSTRAINT "Attempt_videoId_fkey";
DROP INDEX "Attempt_subConceptId_videoId_passed_idx";
ALTER TABLE "Attempt" RENAME COLUMN "videoId" TO "contentId";
CREATE INDEX "Attempt_subConceptId_contentId_passed_idx" ON "Attempt"("subConceptId", "contentId", "passed");
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "SubConceptContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WatchEvent.videoId -> WatchEvent.contentId
DELETE FROM "WatchEvent";
ALTER TABLE "WatchEvent" DROP CONSTRAINT "WatchEvent_videoId_fkey";
DROP INDEX "WatchEvent_videoId_idx";
ALTER TABLE "WatchEvent" RENAME COLUMN "videoId" TO "contentId";
CREATE INDEX "WatchEvent_contentId_idx" ON "WatchEvent"("contentId");
ALTER TABLE "WatchEvent" ADD CONSTRAINT "WatchEvent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "SubConceptContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
