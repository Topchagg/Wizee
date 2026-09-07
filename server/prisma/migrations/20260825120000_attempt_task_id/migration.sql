-- Nullable: existing Attempt rows predate task-level tracking and simply
-- won't count toward "has this user passed every homework task in this
-- content" until they submit again under the new code path.
ALTER TABLE "Attempt" ADD COLUMN "taskId" TEXT;

ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Attempt_userId_contentId_taskId_passed_idx" ON "Attempt"("userId", "contentId", "taskId", "passed");
