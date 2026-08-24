-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firebaseUid" TEXT NOT NULL,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "photoUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");
