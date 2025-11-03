import { Request, Response, NextFunction } from 'express';
import { AutoNotificationService } from '../services/auto-notification.service';
import { logger } from '../utils/logger';

const autoNotificationService = new AutoNotificationService();

export class AutoNotificationController {
  // Executar todas as verificações automáticas
  async runAllChecks(_req: Request, res: Response, next: NextFunction) {
    try {
      await autoNotificationService.runAllChecks();

      res.json({
        success: true,
        message: 'Verificações automáticas executadas com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao executar verificações automáticas:', error);
      return next(error);
    }
  }

  // Verificar apenas notificações de pagamento
  async checkPaymentNotifications(_req: Request, res: Response, next: NextFunction) {
    try {
      await autoNotificationService.checkPaymentDueNotifications();

      res.json({
        success: true,
        message: 'Verificações de pagamento executadas com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao verificar notificações de pagamento:', error);
      return next(error);
    }
  }

  // Verificar apenas notificações de manutenção
  async checkMaintenanceNotifications(_req: Request, res: Response, next: NextFunction) {
    try {
      await autoNotificationService.checkMaintenanceNotifications();

      res.json({
        success: true,
        message: 'Verificações de manutenção executadas com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao verificar notificações de manutenção:', error);
      return next(error);
    }
  }
}


