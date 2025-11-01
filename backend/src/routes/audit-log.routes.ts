import { Router } from 'express';
import { AuditLogController } from '../controllers/audit-log.controller';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();
const auditLogController = new AuditLogController();

// Todas as rotas requerem autenticação de Admin
router.use(authenticate, isAdmin);

router.get('/', auditLogController.findAll.bind(auditLogController));
router.get('/statistics', auditLogController.getStatistics.bind(auditLogController));

export default router;



