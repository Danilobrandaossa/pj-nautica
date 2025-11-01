import { Request, Response } from 'express';
import { AutoNotificationService } from '../services/auto-notification.service';
import { logger } from '../utils/logger';

const autoNotificationService = new AutoNotificationService();

export class AutoNotificationController {
  // Executar todas as verificações automáticas
  async runAllChecks(_req: Request, res: Response) {
    try {
      await autoNotificationService.runAllChecks();

      res.json({
        success: true,
        message: 'Verificações automáticas executadas com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao executar verificações automáticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Verificar apenas notificações de pagamento
  async checkPaymentNotifications(_req: Request, res: Response) {
    try {
      await autoNotificationService.checkPaymentDueNotifications();

      res.json({
        success: true,
        message: 'Verificações de pagamento executadas com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao verificar notificações de pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Verificar apenas notificações de manutenção
  async checkMaintenanceNotifications(_req: Request, res: Response) {
    try {
      await autoNotificationService.checkMaintenanceNotifications();

      res.json({
        success: true,
        message: 'Verificações de manutenção executadas com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao verificar notificações de manutenção:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}


