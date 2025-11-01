import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error-handler';
import { signHmacSHA256 } from '../utils/hmac';
import axios from 'axios';

export class WebhookAdminController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
      res.json({ items });
    } catch (error) { next(error); }
  }

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, tenantId, webhookUrl, secretToken, status } = req.body as any;
      const data = { tenantId, webhookUrl, secretToken, status };
      const item = id
        ? await prisma.webhook.update({ where: { id }, data })
        : await prisma.webhook.create({ data });
      res.json({ item });
    } catch (error) { next(error); }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      await prisma.webhook.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) { next(error); }
  }

  async logs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, eventType, from, to } = req.query as any;
      const where: any = {};
      if (tenantId) {
        const wh = await prisma.webhook.findFirst({ where: { tenantId } });
        if (wh) {
          where.webhookId = wh.id;
        } else {
          res.json({ items: [] });
          return;
        }
      }
      if (eventType) where.eventType = eventType;
      if (from || to) where.createdAt = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };
      const items = await prisma.webhookLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
      res.json({ items });
    } catch (error) { 
      next(error); 
    }
  }

  async resend(req: Request, res: Response, next: NextFunction) {
    try {
      const { logId } = req.params as any;
      const log = await prisma.webhookLog.findUnique({ where: { id: logId }, include: { webhook: true } });
      if (!log) throw new AppError(404, 'Log não encontrado');
      const payload = log.payload as any;
      const signature = signHmacSHA256(JSON.stringify(payload), log.webhook.secretToken);
      const resp = await axios.post(log.webhook.webhookUrl, payload, {
        headers: { 'x-webhook-signature': signature, 'content-type': 'application/json' }
      });
      res.json({ status: resp.status });
    } catch (error) { next(error); }
  }
}

export default new WebhookAdminController();





