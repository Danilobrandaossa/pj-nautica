import { Router } from 'express';
import { TwoFactorController } from '../controllers/two-factor.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const twoFactorController = new TwoFactorController();

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas para configuração e gerenciamento de 2FA
router.post('/generate-secret', twoFactorController.generateSecret.bind(twoFactorController));
router.post('/verify-token', twoFactorController.verifyToken.bind(twoFactorController));
router.post('/enable', twoFactorController.enableTwoFactor.bind(twoFactorController));
router.post('/disable', twoFactorController.disableTwoFactor.bind(twoFactorController));
router.post('/regenerate-backup-codes', twoFactorController.regenerateBackupCodes.bind(twoFactorController));
router.get('/status', twoFactorController.getStatus.bind(twoFactorController));

export default router;

