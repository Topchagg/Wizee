ALTER TABLE "SubConcept" ADD COLUMN "slug" TEXT;

UPDATE "SubConcept"
SET "slug" = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'));

-- Titles aren't guaranteed unique across the whole tree (unlike Subject),
-- so disambiguate any collisions by suffixing a short id fragment.
WITH duplicates AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
  FROM "SubConcept"
)
UPDATE "SubConcept" sc
SET "slug" = sc.slug || '-' || substr(sc.id, 1, 6)
FROM duplicates d
WHERE sc.id = d.id AND d.rn > 1;

ALTER TABLE "SubConcept" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "SubConcept_slug_key" ON "SubConcept"("slug");
