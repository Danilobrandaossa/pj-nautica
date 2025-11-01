import axios from 'axios';
import { settingsService } from './settings.service';
import { signHmacSHA256 } from '../utils/hmac';
import { logger } from '../utils/logger';

export class WebhookPublisher {
  async publish(eventType: string, payload: any, override?: { url?: string; secret?: string }) {
    const url = override?.url ?? await settingsService.get<string>('n8n.incomingUrl', '');
    const secret = override?.secret ?? await settingsService.get<string>('n8n.secret', '');

    if (!url) {
      logger.info('WebhookPublisher skipped: missing url');
      return { skipped: true, reason: 'missing_url' } as const;
    }
    if (!secret) {
      logger.info('WebhookPublisher skipped: missing secret');
      return { skipped: true, reason: 'missing_secret' } as const;
    }

    const body = { type: eventType, payload, timestamp: new Date().toISOString() };
    const raw = JSON.stringify(body);
    const signature = signHmacSHA256(raw, secret);
    
    logger.info('WebhookPublisher: enviando para n8n', { url, eventType, hasSignature: !!signature });
    
    try {
      const res = await axios.post(url, body, {
        headers: { 'content-type': 'application/json', 'x-webhook-signature': signature },
        timeout: 10000,
        validateStatus: () => true, // não lançar erro em qualquer status
      });
      logger.info('WebhookPublisher: resposta do n8n', { status: res.status, statusText: res.statusText });
      return { status: res.status, skipped: false } as const;
    } catch (e: any) {
      logger.error('WebhookPublisher: erro ao enviar', {
        message: e.message,
        code: e.code,
        response: e.response?.data,
        status: e.response?.status,
      });
      throw new Error(`Falha ao enviar para n8n: ${e.message} (${e.response?.status || 'sem status'})`);
    }
  }
}

export const webhookPublisher = new WebhookPublisher();


