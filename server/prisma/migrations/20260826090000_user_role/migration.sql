-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TUTOR', 'LEARNER');

-- Nullable, no default: existing rows land on NULL, which is exactly
-- "hasn't picked yet" — the client prompts for it on next sign-in.
ALTER TABLE "User" ADD COLUMN "role" "Role";
