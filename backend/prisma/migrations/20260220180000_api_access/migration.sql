-- CreateEnum
CREATE TYPE "ApiAccessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "PaymentType" ADD VALUE 'WALLET_TOPUP';

-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE 'TOP_UP';
ALTER TYPE "WalletTransactionType" ADD VALUE 'ORDER_DEBIT';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "apiPriceGhs" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "AgentApiKey" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiAccessRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" "ApiAccessStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentApiKey_agentId_key" ON "AgentApiKey"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentApiKey_keyHash_key" ON "AgentApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "ApiAccessRequest_agentId_key" ON "ApiAccessRequest"("agentId");

-- AddForeignKey
ALTER TABLE "AgentApiKey" ADD CONSTRAINT "AgentApiKey_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiAccessRequest" ADD CONSTRAINT "ApiAccessRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
