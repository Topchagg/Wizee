ALTER TABLE "SubConceptContent" ADD COLUMN "creatorId" TEXT;

ALTER TABLE "SubConceptContent" ADD CONSTRAINT "SubConceptContent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
