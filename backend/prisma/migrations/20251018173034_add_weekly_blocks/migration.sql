-- CreateTable
CREATE TABLE "weekly_blocks" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weekly_blocks_dayOfWeek_idx" ON "weekly_blocks"("dayOfWeek");

-- CreateIndex
CREATE INDEX "weekly_blocks_isActive_idx" ON "weekly_blocks"("isActive");
