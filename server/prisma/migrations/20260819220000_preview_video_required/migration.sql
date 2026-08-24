-- Preview video is now required for new content; backfill existing rows
-- that predate the rule (falls back to the main video) so the NOT NULL
-- constraint below doesn't reject them.
UPDATE "SubConceptContent" SET "previewVideo" = "video" WHERE "previewVideo" IS NULL;

ALTER TABLE "SubConceptContent" ALTER COLUMN "previewVideo" SET NOT NULL;
