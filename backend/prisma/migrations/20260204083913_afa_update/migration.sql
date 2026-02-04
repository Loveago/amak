-- CreateEnum
CREATE TYPE "AfaRegistrationStatus" AS ENUM ('PENDING_PAYMENT', 'SUBMITTED', 'PROCESSING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "PaymentType" ADD VALUE 'AFA_REGISTRATION';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "afaRegistrationId" TEXT;

-- CreateTable
CREATE TABLE "AfaConfig" (
    "id" TEXT NOT NULL,
    "registrationFeeGhs" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AfaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AfaRegistration" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "ghanaCardNumber" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "occupation" TEXT NOT NULL,
    "notes" TEXT,
    "status" "AfaRegistrationStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AfaRegistration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_afaRegistrationId_fkey" FOREIGN KEY ("afaRegistrationId") REFERENCES "AfaRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AfaRegistration" ADD CONSTRAINT "AfaRegistration_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
