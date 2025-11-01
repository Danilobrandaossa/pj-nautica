import { Router } from 'express';
import webhookController from '../controllers/webhook.controller';

const router = Router();

router.post('/:tenant_id', webhookController.handle);
router.get('/test/ping', webhookController.test);

export default router;





