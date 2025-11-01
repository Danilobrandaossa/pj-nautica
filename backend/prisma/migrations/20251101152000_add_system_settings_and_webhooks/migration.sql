-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_logs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "secretToken" VARCHAR(512) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_replays" (
    "id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_replays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "status" TEXT NOT NULL DEFAULT 'success',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_key_idx" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "settings_logs_key_createdAt_idx" ON "settings_logs"("key", "createdAt");

-- CreateIndex
CREATE INDEX "webhooks_tenantId_idx" ON "webhooks"("tenantId");

-- CreateIndex
CREATE INDEX "webhook_logs_webhookId_createdAt_idx" ON "webhook_logs"("webhookId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_replays_signature_key" ON "webhook_replays"("signature");

-- CreateIndex
CREATE INDEX "notification_logs_eventType_channel_createdAt_idx" ON "notification_logs"("eventType", "channel", "createdAt");

-- Add missing deletedAt columns
ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Add missing composite indexes
CREATE INDEX IF NOT EXISTS "installments_userVesselId_status_idx" ON "installments"("userVesselId", "status");
CREATE INDEX IF NOT EXISTS "installments_userVesselId_dueDate_idx" ON "installments"("userVesselId", "dueDate");
CREATE INDEX IF NOT EXISTS "marina_payments_userVesselId_status_idx" ON "marina_payments"("userVesselId", "status");
CREATE INDEX IF NOT EXISTS "marina_payments_userVesselId_dueDate_idx" ON "marina_payments"("userVesselId", "dueDate");
CREATE INDEX IF NOT EXISTS "ad_hoc_charges_userVesselId_status_idx" ON "ad_hoc_charges"("userVesselId", "status");
CREATE INDEX IF NOT EXISTS "ad_hoc_charges_userVesselId_dueDate_idx" ON "ad_hoc_charges"("userVesselId", "dueDate");

-- Add missing indexes for bookings
CREATE INDEX IF NOT EXISTS "bookings_userId_status_idx" ON "bookings"("userId", "status");
CREATE INDEX IF NOT EXISTS "bookings_vesselId_bookingDate_status_idx" ON "bookings"("vesselId", "bookingDate", "status");
CREATE INDEX IF NOT EXISTS "bookings_deletedAt_idx" ON "bookings"("deletedAt");

-- Add missing indexes for vessels
CREATE INDEX IF NOT EXISTS "vessels_deletedAt_idx" ON "vessels"("deletedAt");

-- AddForeignKey
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

