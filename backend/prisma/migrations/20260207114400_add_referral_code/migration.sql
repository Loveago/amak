-- AlterTable
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;

-- Backfill: set referralCode = slug for all existing users
UPDATE "User" SET "referralCode" = "slug" WHERE "slug" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
