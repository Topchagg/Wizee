CREATE TABLE "AlternativeGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subConceptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlternativeGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AlternativeGrant_userId_subConceptId_key" ON "AlternativeGrant"("userId", "subConceptId");

ALTER TABLE "AlternativeGrant" ADD CONSTRAINT "AlternativeGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlternativeGrant" ADD CONSTRAINT "AlternativeGrant_subConceptId_fkey" FOREIGN KEY ("subConceptId") REFERENCES "SubConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
