import { Router } from 'express';
import { AutoNotificationController } from '../controllers/auto-notification.controller';

const router = Router();
const autoNotificationController = new AutoNotificationController();

// Endpoint para executar todas as verificações automáticas
router.post('/run-all-checks', autoNotificationController.runAllChecks.bind(autoNotificationController));

// Endpoint para verificar apenas notificações de pagamento
router.post('/check-payments', autoNotificationController.checkPaymentNotifications.bind(autoNotificationController));

// Endpoint para verificar apenas notificações de manutenção
router.post('/check-maintenance', autoNotificationController.checkMaintenanceNotifications.bind(autoNotificationController));

export default router;


