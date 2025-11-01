import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';
import { NotificationService } from './notification.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

export class AutoNotificationService {
  // Verificar e enviar notificações de vencimento
  async checkPaymentDueNotifications() {
    
    // 1. Verificar parcelas vencendo em 1 dia
    await this.checkInstallmentsDueTomorrow();
    
    // 2. Verificar mensalidades vencendo em 1 dia
    await this.checkMarinaPaymentsDueTomorrow();
    
    // 3. Verificar parcelas vencidas hoje
    await this.checkInstallmentsOverdueToday();
    
    // 4. Verificar mensalidades vencidas hoje
    await this.checkMarinaPaymentsOverdueToday();
    
    // 5. Verificar parcelas vencidas há 2 dias (mudança para inadimplente)
    await this.checkInstallmentsOverdue2Days();
    
    // 6. Verificar mensalidades vencidas há 2 dias
    await this.checkMarinaPaymentsOverdue2Days();
  }

  private async checkInstallmentsDueTomorrow() {
    const tomorrow = addDays(new Date(), 1);
    const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const endOfTomorrow = addDays(startOfTomorrow, 1);

    const installments = await prisma.installment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: startOfTomorrow,
          lt: endOfTomorrow
        }
      },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });

    for (const installment of installments) {
      await notificationService.create({
        title: '💳 Parcela Vencendo Amanhã',
        message: `Sua parcela #${installment.installmentNumber} da embarcação ${installment.userVessel.vessel.name} vence amanhã (${installment.dueDate.toLocaleDateString('pt-BR')}). Valor: R$ ${installment.amount.toFixed(2)}.`,
        type: 'PAYMENT',
        userId: installment.userVessel.userId,
        expiresAt: addDays(new Date(), 3) // Notificação expira em 3 dias
      });
    }
  }

  private async checkMarinaPaymentsDueTomorrow() {
    const tomorrow = addDays(new Date(), 1);
    const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const endOfTomorrow = addDays(startOfTomorrow, 1);

    const payments = await prisma.marinaPayment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: startOfTomorrow,
          lt: endOfTomorrow
        }
      },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });

    for (const payment of payments) {
      await notificationService.create({
        title: '🏢 Mensalidade da Marina Vencendo Amanhã',
        message: `Sua mensalidade da marina para a embarcação ${payment.userVessel.vessel.name} vence amanhã (${payment.dueDate.toLocaleDateString('pt-BR')}). Valor: R$ ${payment.amount.toFixed(2)}.`,
        type: 'PAYMENT',
        userId: payment.userVessel.userId,
        expiresAt: addDays(new Date(), 3)
      });
    }
  }

  private async checkInstallmentsOverdueToday() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = addDays(startOfToday, 1);

    const installments = await prisma.installment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: startOfToday,
          lt: endOfToday
        }
      },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });

    for (const installment of installments) {
      await notificationService.create({
        title: '🚨 Parcela Vencida Hoje',
        message: `Sua parcela #${installment.installmentNumber} da embarcação ${installment.userVessel.vessel.name} vence hoje (${installment.dueDate.toLocaleDateString('pt-BR')}). Valor: R$ ${installment.amount.toFixed(2)}. Por favor, efetue o pagamento o quanto antes.`,
        type: 'WARNING',
        userId: installment.userVessel.userId,
        expiresAt: addDays(new Date(), 7)
      });
    }
  }

  private async checkMarinaPaymentsOverdueToday() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = addDays(startOfToday, 1);

    const payments = await prisma.marinaPayment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: startOfToday,
          lt: endOfToday
        }
      },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });

    for (const payment of payments) {
      await notificationService.create({
        title: '🚨 Mensalidade da Marina Vencida Hoje',
        message: `Sua mensalidade da marina para a embarcação ${payment.userVessel.vessel.name} vence hoje (${payment.dueDate.toLocaleDateString('pt-BR')}). Valor: R$ ${payment.amount.toFixed(2)}. Por favor, efetue o pagamento o quanto antes.`,
        type: 'WARNING',
        userId: payment.userVessel.userId,
        expiresAt: addDays(new Date(), 7)
      });
    }
  }

  private async checkInstallmentsOverdue2Days() {
    const twoDaysAgo = addDays(new Date(), -2);
    const startOfTwoDaysAgo = new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate());
    const endOfTwoDaysAgo = addDays(startOfTwoDaysAgo, 1);

    const installments = await prisma.installment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: startOfTwoDaysAgo,
          lt: endOfTwoDaysAgo
        }
      },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });

    for (const installment of installments) {
      // Criar notificação de inadimplência
      await notificationService.create({
        title: '🚫 Parcela em Atraso - Status Alterado',
        message: `Sua parcela #${installment.installmentNumber} da embarcação ${installment.userVessel.vessel.name} está em atraso há 2 dias. Seu status foi alterado para inadimplente. Entre em contato com o administrador para regularizar. Valor: R$ ${installment.amount.toFixed(2)}.`,
        type: 'WARNING',
        userId: installment.userVessel.userId,
        expiresAt: addDays(new Date(), 30)
      });

      // Atualizar status da parcela para OVERDUE
      await prisma.installment.update({
        where: { id: installment.id },
        data: { status: 'OVERDUE' }
      });
    }
  }

  private async checkMarinaPaymentsOverdue2Days() {
    const twoDaysAgo = addDays(new Date(), -2);
    const startOfTwoDaysAgo = new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate());
    const endOfTwoDaysAgo = addDays(startOfTwoDaysAgo, 1);

    const payments = await prisma.marinaPayment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: startOfTwoDaysAgo,
          lt: endOfTwoDaysAgo
        }
      },
      include: {
        userVessel: {
          include: {
            user: true,
            vessel: true
          }
        }
      }
    });

    for (const payment of payments) {
      // Criar notificação de inadimplência
      await notificationService.create({
        title: '🚫 Mensalidade da Marina em Atraso',
        message: `Sua mensalidade da marina para a embarcação ${payment.userVessel.vessel.name} está em atraso há 2 dias. Entre em contato com o administrador para regularizar. Valor: R$ ${payment.amount.toFixed(2)}.`,
        type: 'WARNING',
        userId: payment.userVessel.userId,
        expiresAt: addDays(new Date(), 30)
      });

      // Atualizar status do pagamento para OVERDUE
      await prisma.marinaPayment.update({
        where: { id: payment.id },
        data: { status: 'OVERDUE' }
      });
    }
  }

  // Verificar e enviar notificações de manutenção
  async checkMaintenanceNotifications() {
    const now = new Date();
    
    // Buscar bloqueios de manutenção que começam em 3 dias
    const maintenanceBlockages = await prisma.blockedDate.findMany({
      where: {
        reason: 'MAINTENANCE',
        startDate: {
          gte: addDays(now, 2),
          lte: addDays(now, 4)
        }
      },
      include: {
        vessel: {
          include: {
            users: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    for (const blockage of maintenanceBlockages) {
      // Notificar todos os usuários da embarcação
      for (const userVessel of blockage.vessel.users) {
        await notificationService.create({
          title: '🔧 Manutenção Programada',
          message: `A embarcação ${blockage.vessel.name} passará por manutenção de ${blockage.startDate.toLocaleDateString('pt-BR')} até ${blockage.endDate.toLocaleDateString('pt-BR')}. ${blockage.notes ? `Detalhes: ${blockage.notes}` : ''}`,
          type: 'MAINTENANCE',
          userId: userVessel.userId,
          expiresAt: addDays(new Date(), 7)
        });
      }
    }
  }

  // Verificar e enviar notificações de sorteio
  async checkDrawNotifications() {
    const now = new Date();
    
    // Buscar bloqueios de sorteio que começam em 1 dia
    const drawBlockages = await prisma.blockedDate.findMany({
      where: {
        reason: 'DRAW',
        startDate: {
          gte: addDays(now, 0),
          lte: addDays(now, 2)
        }
      },
      include: {
        vessel: {
          include: {
            users: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    for (const blockage of drawBlockages) {
      // Notificar todos os usuários da embarcação
      for (const userVessel of blockage.vessel.users) {
        await notificationService.create({
          title: '🎲 Sorteio Programado',
          message: `A embarcação ${blockage.vessel.name} estará em sorteio de ${blockage.startDate.toLocaleDateString('pt-BR')} até ${blockage.endDate.toLocaleDateString('pt-BR')}. ${blockage.notes ? `Detalhes: ${blockage.notes}` : ''}`,
          type: 'INFO',
          userId: userVessel.userId,
          expiresAt: addDays(new Date(), 3)
        });
      }
    }
  }

  // Executar todas as verificações automáticas
  async runAllChecks() {
    try {
      await this.checkPaymentDueNotifications();
      await this.checkMaintenanceNotifications();
      await this.checkDrawNotifications();
      
      logger.info('✅ Verificações automáticas de notificação concluídas');
    } catch (error) {
      logger.error('❌ Erro nas verificações automáticas:', error);
    }
  }
}
