-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN "momoName" TEXT NOT NULL DEFAULT '';

-- Optional: remove default after backfill (kept for safety)
