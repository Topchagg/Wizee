CREATE TYPE "SearchEntryType" AS ENUM ('THEME', 'CONCEPT', 'SUBCONCEPT');

CREATE TABLE "SearchTable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SearchEntryType" NOT NULL,
    "idLink" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "themeId" TEXT,
    "themeTitle" TEXT,
    "conceptId" TEXT,
    "conceptTitle" TEXT,

    CONSTRAINT "SearchTable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SearchTable_subjectId_idx" ON "SearchTable"("subjectId");
CREATE INDEX "SearchTable_name_idx" ON "SearchTable"("name");
