-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `status` ENUM('ACTIVE', 'OVERDUE', 'OVERDUE_PAYMENT', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    `phone` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `birthDate` DATETIME(3) NULL,
    `licenseType` VARCHAR(191) NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `licenseExpiry` DATETIME(3) NULL,
    `billingDueDay` INTEGER NULL,
    `address` VARCHAR(191) NULL,
    `zipCode` VARCHAR(191) NULL,
    `addressNumber` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `neighborhood` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `complement` VARCHAR(191) NULL,
    `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorSecret` VARCHAR(191) NULL,
    `backupCodes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `lastLoginIp` VARCHAR(191) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    INDEX `refresh_tokens_token_idx`(`token`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vessels` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `capacity` INTEGER NULL,
    `location` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `calendarDaysAhead` INTEGER NOT NULL DEFAULT 62,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `vessels_name_idx`(`name`),
    INDEX `vessels_isActive_idx`(`isActive`),
    INDEX `vessels_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_vessels` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `vesselId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'PAID_OFF', 'DEFAULTED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalValue` DOUBLE NOT NULL DEFAULT 0,
    `downPayment` DOUBLE NOT NULL DEFAULT 0,
    `remainingAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalInstallments` INTEGER NOT NULL DEFAULT 0,
    `marinaMonthlyFee` DOUBLE NOT NULL DEFAULT 0,
    `marinaDueDay` INTEGER NOT NULL DEFAULT 5,

    INDEX `user_vessels_userId_idx`(`userId`),
    INDEX `user_vessels_vesselId_idx`(`vesselId`),
    UNIQUE INDEX `user_vessels_userId_vesselId_key`(`userId`, `vesselId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `vesselId` VARCHAR(191) NOT NULL,
    `bookingDate` DATE NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `notes` VARCHAR(191) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancellationReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdByIp` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `bookings_userId_idx`(`userId`),
    INDEX `bookings_vesselId_idx`(`vesselId`),
    INDEX `bookings_bookingDate_idx`(`bookingDate`),
    INDEX `bookings_status_idx`(`status`),
    INDEX `bookings_userId_status_idx`(`userId`, `status`),
    INDEX `bookings_vesselId_bookingDate_status_idx`(`vesselId`, `bookingDate`, `status`),
    INDEX `bookings_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `bookings_vesselId_bookingDate_key`(`vesselId`, `bookingDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blocked_dates` (
    `id` VARCHAR(191) NOT NULL,
    `vesselId` VARCHAR(191) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `reason` ENUM('MAINTENANCE', 'DRAW', 'UNAVAILABLE', 'OVERDUE_PAYMENT', 'OTHER') NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `blocked_dates_vesselId_idx`(`vesselId`),
    INDEX `blocked_dates_startDate_idx`(`startDate`),
    INDEX `blocked_dates_endDate_idx`(`endDate`),
    INDEX `blocked_dates_vesselId_startDate_endDate_idx`(`vesselId`, `startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_limits` (
    `id` VARCHAR(191) NOT NULL,
    `vesselId` VARCHAR(191) NOT NULL,
    `maxActiveBookings` INTEGER NOT NULL DEFAULT 2,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `booking_limits_vesselId_key`(`vesselId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` ENUM('USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'VESSEL_CREATED', 'VESSEL_UPDATED', 'VESSEL_DELETED', 'BOOKING_CREATED', 'BOOKING_UPDATED', 'BOOKING_CANCELLED', 'BOOKING_DELETED', 'DATE_BLOCKED', 'DATE_UNBLOCKED', 'LIMIT_UPDATED', 'LOGIN', 'LOGOUT') NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_entityType_idx`(`entityType`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `isGlobal` BOOLEAN NOT NULL DEFAULT false,
    `targetRole` ENUM('ADMIN', 'USER') NULL,
    `vesselId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_isActive_idx`(`isActive`),
    INDEX `notifications_isGlobal_idx`(`isGlobal`),
    INDEX `notifications_targetRole_idx`(`targetRole`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_notifications_userId_idx`(`userId`),
    INDEX `user_notifications_notificationId_idx`(`notificationId`),
    INDEX `user_notifications_isRead_idx`(`isRead`),
    INDEX `user_notifications_userId_isRead_idx`(`userId`, `isRead`),
    UNIQUE INDEX `user_notifications_userId_notificationId_key`(`userId`, `notificationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `installments` (
    `id` VARCHAR(191) NOT NULL,
    `userVesselId` VARCHAR(191) NOT NULL,
    `installmentNumber` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `paymentDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `installments_userVesselId_idx`(`userVesselId`),
    INDEX `installments_dueDate_idx`(`dueDate`),
    INDEX `installments_status_idx`(`status`),
    INDEX `installments_userVesselId_status_idx`(`userVesselId`, `status`),
    INDEX `installments_userVesselId_dueDate_idx`(`userVesselId`, `dueDate`),
    UNIQUE INDEX `installments_userVesselId_installmentNumber_key`(`userVesselId`, `installmentNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marina_payments` (
    `id` VARCHAR(191) NOT NULL,
    `userVesselId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `paymentDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `marina_payments_userVesselId_idx`(`userVesselId`),
    INDEX `marina_payments_dueDate_idx`(`dueDate`),
    INDEX `marina_payments_status_idx`(`status`),
    INDEX `marina_payments_userVesselId_status_idx`(`userVesselId`, `status`),
    INDEX `marina_payments_userVesselId_dueDate_idx`(`userVesselId`, `dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ad_hoc_charges` (
    `id` VARCHAR(191) NOT NULL,
    `userVesselId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paymentDate` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ad_hoc_charges_userVesselId_idx`(`userVesselId`),
    INDEX `ad_hoc_charges_status_idx`(`status`),
    INDEX `ad_hoc_charges_userVesselId_status_idx`(`userVesselId`, `status`),
    INDEX `ad_hoc_charges_userVesselId_dueDate_idx`(`userVesselId`, `dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weekly_blocks` (
    `id` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `weekly_blocks_dayOfWeek_idx`(`dayOfWeek`),
    INDEX `weekly_blocks_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_vessels` ADD CONSTRAINT `user_vessels_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_vessels` ADD CONSTRAINT `user_vessels_vesselId_fkey` FOREIGN KEY (`vesselId`) REFERENCES `vessels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_vesselId_fkey` FOREIGN KEY (`vesselId`) REFERENCES `vessels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocked_dates` ADD CONSTRAINT `blocked_dates_vesselId_fkey` FOREIGN KEY (`vesselId`) REFERENCES `vessels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_limits` ADD CONSTRAINT `booking_limits_vesselId_fkey` FOREIGN KEY (`vesselId`) REFERENCES `vessels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notifications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `installments` ADD CONSTRAINT `installments_userVesselId_fkey` FOREIGN KEY (`userVesselId`) REFERENCES `user_vessels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marina_payments` ADD CONSTRAINT `marina_payments_userVesselId_fkey` FOREIGN KEY (`userVesselId`) REFERENCES `user_vessels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_hoc_charges` ADD CONSTRAINT `ad_hoc_charges_userVesselId_fkey` FOREIGN KEY (`userVesselId`) REFERENCES `user_vessels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

