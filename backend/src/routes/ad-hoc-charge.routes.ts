import { Router } from 'express';
import { AdHocChargeController } from '../controllers/ad-hoc-charge.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const adHocChargeController = new AdHocChargeController();

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas para administradores
router.post('/user-vessel/:userVesselId/charges', authorize('ADMIN'), adHocChargeController.createCharge.bind(adHocChargeController));
router.get('/all-charges', authorize('ADMIN'), adHocChargeController.getAllCharges.bind(adHocChargeController));
router.put('/charge/:chargeId', authorize('ADMIN'), adHocChargeController.updateCharge.bind(adHocChargeController));
router.delete('/charge/:chargeId', authorize('ADMIN'), adHocChargeController.deleteCharge.bind(adHocChargeController));

// Rotas para usuários e administradores
router.get('/user-vessel/:userVesselId/charges', adHocChargeController.getCharges.bind(adHocChargeController));
router.get('/user-vessel/:userVesselId/financial-history', adHocChargeController.getFinancialHistory.bind(adHocChargeController));
router.post('/charge/:chargeId/pay', adHocChargeController.payCharge.bind(adHocChargeController));
router.post('/charge/:chargeId/cancel', adHocChargeController.cancelCharge.bind(adHocChargeController));

export default router;


