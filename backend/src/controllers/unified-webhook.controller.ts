import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { verifyHmacSHA256 } from '../utils/hmac';
import { AppError } from '../middleware/error-handler';

export class UnifiedWebhookController {
  private async verify(req: Request) {
    const { tenant_id } = req.params as { tenant_id: string };
    const wh = await prisma.webhook.findFirst({ where: { tenantId: tenant_id, status: 'active' } });
    if (!wh) throw new AppError(404, 'Webhook não configurado');
    const signature = (req.headers['x-webhook-signature'] as string) || '';
    const auth = req.headers.authorization;
    const rawBody = JSON.stringify(req.body ?? {});

    let ok = false;
    if (signature) {
      try { ok = verifyHmacSHA256(rawBody, wh.secretToken, signature); } catch { ok = false; }
    }
    if (!ok && auth?.startsWith('Bearer ')) ok = auth.substring(7) === wh.secretToken;
    if (!ok) throw new AppError(401, 'Assinatura inválida');
    return wh;
  }

  async handle(req: Request, res: Response, next: NextFunction) {
    try {
      const wh = await this.verify(req);
      const event = (req.body?.event as string) || 'unknown';

      // Basic normalization
      switch (event) {
        case 'payment_status_update': {
          const { invoice_id, status, due_date } = req.body as any;
          await prisma.installment.updateMany({
            where: { id: invoice_id },
            data: { status: status?.toUpperCase?.() || 'PENDING', dueDate: due_date ? new Date(due_date) : undefined },
          });
          break;
        }
        case 'booking.created':
        case 'booking.cancelled':
        default: {
          // log-only; downstream automations tratam
          break;
        }
      }

      await prisma.webhookLog.create({
        data: {
          webhookId: wh.id,
          eventType: event,
          payload: req.body as any,
          responseStatus: 200,
        },
      });

      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async report(_req: Request, res: Response, next: NextFunction) {
    try {
      const gateways = [ 'mercado_pago' ];
      const activeWebhooks = await prisma.webhook.findMany({});
      const failedLogs = await prisma.webhookLog.findMany({ where: { responseStatus: { gt: 299 } }, take: 50, orderBy: { createdAt: 'desc' } });
      const blockedUsers = await prisma.user.findMany({ where: { status: 'BLOCKED' }, select: { id: true, email: true, name: true } });
      const notifications = await prisma.notificationLog.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
      res.json({
        gateways,
        webhooks: activeWebhooks,
        failedLogs,
        blockedUsers,
        notifications,
      });
    } catch (error) { next(error); }
  }
}

export default new UnifiedWebhookController();





