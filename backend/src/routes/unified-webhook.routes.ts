import { Router } from 'express';
import unified from '../controllers/unified-webhook.controller';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();

// Recebe notificações externas
router.post('/:tenant_id', unified.handle);

// Relatório consolidado
router.get('/admin/report', authenticate, isAdmin, unified.report);

export default router;





