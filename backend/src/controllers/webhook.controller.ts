import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { verifyHmacSHA256 } from '../utils/hmac';
import { AppError } from '../middleware/error-handler';

export class WebhookController {
  async handle(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenant_id } = req.params as { tenant_id: string };
      const webhook = await prisma.webhook.findFirst({ where: { tenantId: tenant_id, status: 'active' } });
      if (!webhook) throw new AppError(404, 'Webhook não configurado');

      const signature = req.headers['x-webhook-signature'] as string | undefined;
      const auth = req.headers.authorization;

      // Aceita HMAC (x-webhook-signature) ou Bearer token
      const rawBody = JSON.stringify(req.body ?? {});
      let authorized = false;
      if (signature) {
        try {
          authorized = verifyHmacSHA256(rawBody, webhook.secretToken, signature);
        } catch {
          authorized = false;
        }
      }

      if (!authorized && auth?.startsWith('Bearer ')) {
        const token = auth.substring(7);
        authorized = token === webhook.secretToken; // simples opção alternativa
      }

      if (!authorized) throw new AppError(401, 'Assinatura inválida');

      const { event, status, transaction_id } = req.body as any;

      // Regras básicas de processamento
      if (event === 'payment.updated') {
        // Atualizar status de cobrança (exemplo: tabela installments/marina_payments)
        // Aqui apenas registra log; a integração real liga ao seu domínio
      }

      // Log sempre
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          eventType: event || 'unknown',
          payload: req.body as any,
          responseStatus: 200,
        },
      });

      res.status(200).json({ ok: true, received: { event, status, transaction_id } });
    } catch (error) {
      next(error);
    }
  }

  async test(_req: Request, res: Response) {
    res.json({ ok: true, message: 'Webhook test OK' });
  }
}

export default new WebhookController();





