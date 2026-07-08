-- AlterTable
ALTER TABLE "Order" ADD COLUMN "autoReconciledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ReconcilerConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReconcilerConfig_pkey" PRIMARY KEY ("id")
);
