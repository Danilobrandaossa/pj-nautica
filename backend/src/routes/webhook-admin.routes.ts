import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import webhookAdmin from '../controllers/webhook-admin.controller';
import { webhookPublisher } from '../services/webhook-publisher.service';

const router = Router();
router.use(authenticate, isAdmin);

router.get('/', webhookAdmin.list);
router.post('/', webhookAdmin.upsert);
router.delete('/:id', webhookAdmin.remove);
router.get('/logs', webhookAdmin.logs);
router.post('/logs/:logId/resend', webhookAdmin.resend);

// Test outgoing webhook
router.post('/test-outgoing', async (req, res, next) => {
  try {
    const { url, secret } = req.body as any;
    const resp = await webhookPublisher.publish('test.ping', { ok: true }, { url, secret });
    res.json(resp);
  } catch (e) { next(e); }
});

export default router;


