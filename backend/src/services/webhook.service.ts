import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

interface BookingData {
  id: string;
  bookingDate: Date;
  status: string;
  user: {
    name: string;
    email: string;
    phone?: string | null;
  };
  vessel: {
    name: string;
  };
}

export class WebhookService {
  async sendBookingCreated(booking: BookingData) {
    if (!config.n8n.webhookUrl) {
      logger.warn('N8N Webhook URL não configurada');
      return;
    }

    try {
      const payload = {
        event: 'booking.created',
        timestamp: new Date().toISOString(),
        data: {
          bookingId: booking.id,
          vessel: booking.vessel.name,
          user: booking.user.name,
          userEmail: booking.user.email,
          userPhone: booking.user.phone,
          date: booking.bookingDate,
          status: booking.status,
        },
        // Templates para WhatsApp
        messages: {
          admin: `🚤 *Novo Agendamento*\n\n*Embarcação:* ${booking.vessel.name}\n*Cotista:* ${booking.user.name}\n*Data:* ${new Date(booking.bookingDate).toLocaleDateString('pt-BR')}\n*Status:* ${this.translateStatus(booking.status)}`,
          client: `✅ *Agendamento Confirmado*\n\n*Embarcação:* ${booking.vessel.name}\n*Data:* ${new Date(booking.bookingDate).toLocaleDateString('pt-BR')}\n*Status:* ${this.translateStatus(booking.status)}\n\nBom passeio! 🌊`,
        },
      };

      await axios.post(config.n8n.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(config.n8n.webhookToken && {
            'Authorization': `Bearer ${config.n8n.webhookToken}`,
          }),
        },
        timeout: 5000,
      });

      logger.info('Webhook enviado com sucesso:', {
        event: 'booking.created',
        bookingId: booking.id,
      });
    } catch (error) {
      logger.error('Erro ao enviar webhook:', error);
      throw error;
    }
  }

  async sendBookingCancelled(booking: BookingData, reason?: string) {
    if (!config.n8n.webhookUrl) {
      logger.warn('N8N Webhook URL não configurada');
      return;
    }

    try {
      const payload = {
        event: 'booking.cancelled',
        timestamp: new Date().toISOString(),
        data: {
          bookingId: booking.id,
          vessel: booking.vessel.name,
          user: booking.user.name,
          userEmail: booking.user.email,
          userPhone: booking.user.phone,
          date: booking.bookingDate,
          status: booking.status,
          reason,
        },
        messages: {
          admin: `❌ *Cancelamento de Agendamento*\n\n*Embarcação:* ${booking.vessel.name}\n*Cotista:* ${booking.user.name}\n*Data:* ${new Date(booking.bookingDate).toLocaleDateString('pt-BR')}\n*Status:* Cancelado${reason ? `\n*Motivo:* ${reason}` : ''}`,
          client: `❌ *Agendamento Cancelado*\n\n*Embarcação:* ${booking.vessel.name}\n*Data:* ${new Date(booking.bookingDate).toLocaleDateString('pt-BR')}\n*Status:* Cancelado${reason ? `\n*Motivo:* ${reason}` : ''}`,
        },
      };

      await axios.post(config.n8n.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(config.n8n.webhookToken && {
            'Authorization': `Bearer ${config.n8n.webhookToken}`,
          }),
        },
        timeout: 5000,
      });

      logger.info('Webhook enviado com sucesso:', {
        event: 'booking.cancelled',
        bookingId: booking.id,
      });
    } catch (error) {
      logger.error('Erro ao enviar webhook:', error);
      throw error;
    }
  }

  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'Pendente',
      APPROVED: 'Aprovado',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado',
    };
    return statusMap[status] || status;
  }
}



