-- CreateEnum
CREATE TYPE "SuggestionType" AS ENUM ('THEME', 'CONCEPT', 'SUBCONCEPT');

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "type" "SuggestionType" NOT NULL,
    "title" TEXT NOT NULL,
    "subjectId" TEXT,
    "themeId" TEXT,
    "conceptId" TEXT,
    "suggestedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Suggestion_subjectId_idx" ON "Suggestion"("subjectId");
CREATE INDEX "Suggestion_themeId_idx" ON "Suggestion"("themeId");
CREATE INDEX "Suggestion_conceptId_idx" ON "Suggestion"("conceptId");

ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_suggestedById_fkey" FOREIGN KEY ("suggestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
