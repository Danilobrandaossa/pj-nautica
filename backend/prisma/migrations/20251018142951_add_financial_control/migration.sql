-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VesselStatus" AS ENUM ('ACTIVE', 'PAID_OFF', 'DEFAULTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "user_vessels" ADD COLUMN     "downPayment" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "marinaDueDay" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "marinaMonthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "status" "VesselStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "totalInstallments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "installments" (
    "id" TEXT NOT NULL,
    "userVesselId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marina_payments" (
    "id" TEXT NOT NULL,
    "userVesselId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marina_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "installments_userVesselId_idx" ON "installments"("userVesselId");

-- CreateIndex
CREATE INDEX "installments_dueDate_idx" ON "installments"("dueDate");

-- CreateIndex
CREATE INDEX "installments_status_idx" ON "installments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "installments_userVesselId_installmentNumber_key" ON "installments"("userVesselId", "installmentNumber");

-- CreateIndex
CREATE INDEX "marina_payments_userVesselId_idx" ON "marina_payments"("userVesselId");

-- CreateIndex
CREATE INDEX "marina_payments_dueDate_idx" ON "marina_payments"("dueDate");

-- CreateIndex
CREATE INDEX "marina_payments_status_idx" ON "marina_payments"("status");

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_userVesselId_fkey" FOREIGN KEY ("userVesselId") REFERENCES "user_vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marina_payments" ADD CONSTRAINT "marina_payments_userVesselId_fkey" FOREIGN KEY ("userVesselId") REFERENCES "user_vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
