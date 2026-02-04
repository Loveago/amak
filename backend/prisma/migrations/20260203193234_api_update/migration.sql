-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "providerLastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "providerPayload" JSONB,
ADD COLUMN     "providerReference" TEXT,
ADD COLUMN     "providerStatus" TEXT;
