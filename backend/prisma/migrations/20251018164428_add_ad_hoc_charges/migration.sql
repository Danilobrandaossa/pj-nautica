-- CreateTable
CREATE TABLE "ad_hoc_charges" (
    "id" TEXT NOT NULL,
    "userVesselId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_hoc_charges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_hoc_charges_userVesselId_idx" ON "ad_hoc_charges"("userVesselId");

-- CreateIndex
CREATE INDEX "ad_hoc_charges_status_idx" ON "ad_hoc_charges"("status");

-- AddForeignKey
ALTER TABLE "ad_hoc_charges" ADD CONSTRAINT "ad_hoc_charges_userVesselId_fkey" FOREIGN KEY ("userVesselId") REFERENCES "user_vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
