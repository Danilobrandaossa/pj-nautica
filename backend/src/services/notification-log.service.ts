import { prisma } from '../utils/prisma';

export class NotificationLogService {
  async log(data: {
    eventType: string;
    recipient: string; // email/phone/userId
    channel: 'whatsapp' | 'email' | 'telegram' | 'push' | 'webhook';
    message: string;
    meta?: Record<string, unknown>;
    status?: 'success' | 'error' | 'queued';
  }) {
    return prisma.notificationLog.create({
      data: {
        eventType: data.eventType,
        recipient: data.recipient,
        channel: data.channel,
        message: data.message,
        meta: (data.meta ?? {}) as any,
        status: data.status ?? 'success',
      },
    });
  }
}

export const notificationLogService = new NotificationLogService();





