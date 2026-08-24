ALTER TABLE "Subject" ADD COLUMN "slug" TEXT;

-- Backfill from title for any Subject that already exists, rather than
-- requiring a reseed: "Mathematics" -> "mathematics", "Applied Math!" ->
-- "applied-math", collapsing repeated/leading/trailing separators.
UPDATE "Subject"
SET "slug" = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'));

ALTER TABLE "Subject" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Subject_slug_key" ON "Subject"("slug");
