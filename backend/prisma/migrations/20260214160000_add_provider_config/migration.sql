-- CreateTable
CREATE TABLE "ProviderConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "forceProvider" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderConfig_pkey" PRIMARY KEY ("id")
);
