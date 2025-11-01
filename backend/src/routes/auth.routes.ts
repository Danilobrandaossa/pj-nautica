import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { loginRateLimiter, authActionLimiter } from '../middleware/rate-limiter';
import { validateCSRF, validateOrigin } from '../middleware/csrf';

const router = Router();
const authController = new AuthController();

// Rotas de autenticação não precisam de CSRF (usam rate limiting)
// Mas aplicamos validação de Origin para segurança adicional
router.post('/login', validateOrigin, loginRateLimiter, authController.login.bind(authController));
router.post('/refresh', validateOrigin, authActionLimiter, authController.refreshToken.bind(authController));
router.post('/logout', authenticate, validateOrigin, authActionLimiter, validateCSRF, authController.logout.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;



