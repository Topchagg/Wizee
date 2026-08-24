ALTER TABLE "Test" ADD COLUMN "isHomework" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Test" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Test_contentId_isHomework_idx" ON "Test"("contentId", "isHomework");
