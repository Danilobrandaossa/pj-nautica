import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
// Rate limiters desabilitados por solicitação
import { validateCSRF, validateOrigin } from '../middleware/csrf';

const router = Router();
const authController = new AuthController();

// Rotas de autenticação não precisam de CSRF (usam rate limiting)
// Mas aplicamos validação de Origin para segurança adicional
router.post('/login', validateOrigin, authController.login.bind(authController));
router.post('/refresh', validateOrigin, authController.refreshToken.bind(authController));
router.post('/logout', authenticate, validateOrigin, validateCSRF, authController.logout.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;



