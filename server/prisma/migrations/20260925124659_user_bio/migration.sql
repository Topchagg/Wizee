-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT;

-- RenameIndex
ALTER INDEX "Test_contentId_isHomework_idx" RENAME TO "Test_contentId_isSolvedOnScreen_idx";
