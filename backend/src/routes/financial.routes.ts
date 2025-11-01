import { Router } from 'express';
import { FinancialController } from '../controllers/financial.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const financialController = new FinancialController();

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas para administradores
router.put('/vessel/:userVesselId/financials', financialController.updateVesselFinancials.bind(financialController));
router.get('/report', financialController.getFinancialReport.bind(financialController));
router.post('/check-overdue', financialController.checkOverduePayments.bind(financialController));

// Rotas para usuários específicos (admin pode acessar qualquer usuário)
router.get('/user/:userId', financialController.getUserFinancialInfo.bind(financialController));

// Rotas para o usuário logado
router.get('/my-financials', financialController.getMyFinancialInfo.bind(financialController));

// Rotas para registrar pagamentos
router.post('/installment/:installmentId/pay', financialController.payInstallment.bind(financialController));
router.post('/marina-payment/:paymentId/pay', financialController.payMarinaPayment.bind(financialController));
router.post('/register-payment', financialController.registerPayment.bind(financialController));

// Rotas para painel de prioridade e ações rápidas
router.get('/payments-by-priority', financialController.getPaymentsByPriority.bind(financialController));
router.post('/quick-payment/:paymentId', financialController.quickPayment.bind(financialController));

export default router;
