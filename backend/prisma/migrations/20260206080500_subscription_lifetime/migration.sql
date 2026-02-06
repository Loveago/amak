-- Make subscription dates optional for lifetime access
ALTER TABLE "Subscription" ALTER COLUMN "expiresAt" DROP NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "graceEndsAt" DROP NOT NULL;

-- Backfill existing subscriptions to lifetime
UPDATE "Subscription"
SET "status" = 'ACTIVE',
    "expiresAt" = NULL,
    "graceEndsAt" = NULL
WHERE "status" <> 'CANCELED';
