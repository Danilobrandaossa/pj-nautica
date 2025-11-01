import { Router } from 'express';
import authRoutes from '../auth.routes';
import userRoutes from '../user.routes';
import vesselRoutes from '../vessel.routes';
import bookingRoutes from '../booking.routes';
import blockedDateRoutes from '../blocked-date.routes';
import auditLogRoutes from '../audit-log.routes';
import notificationRoutes from '../notification.routes';
import financialRoutes from '../financial.routes';
import autoNotificationRoutes from '../auto-notification.routes';
import adHocChargeRoutes from '../ad-hoc-charge.routes';
import weeklyBlockRoutes from '../weekly-block.routes';
import twoFactorRoutes from '../two-factor.routes';

const router = Router();

// Todas as rotas da API v1
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vessels', vesselRoutes);
router.use('/bookings', bookingRoutes);
router.use('/blocked-dates', blockedDateRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/notifications', notificationRoutes);
router.use('/financial', financialRoutes);
router.use('/auto-notifications', autoNotificationRoutes);
router.use('/ad-hoc-charges', adHocChargeRoutes);
router.use('/weekly-blocks', weeklyBlockRoutes);
router.use('/two-factor', twoFactorRoutes);

export default router;



