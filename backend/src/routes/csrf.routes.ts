import { Router } from 'express';
import { getCSRFToken, generateCSRF } from '../middleware/csrf';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/csrf-token
 * Retorna um token CSRF válido
 * Requer autenticação
 */
router.get('/csrf-token', authenticate, generateCSRF, getCSRFToken);

export default router;



