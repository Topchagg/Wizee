-- Every existing row is currently `isHomework = false` (the only value ever
-- written so far), which is exactly the correct default under the new
-- meaning too — an ordinary task, not a solved-on-screen one — so a plain
-- rename needs no data backfill.
ALTER TABLE "Test" RENAME COLUMN "isHomework" TO "isSolvedOnScreen";
