import { Router } from 'express';
import { WeeklyBlockController } from '../controllers/weekly-block.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateCSRF, validateOrigin } from '../middleware/csrf';

const router = Router();
const weeklyBlockController = new WeeklyBlockController();

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Middleware CSRF para rotas mutáveis
router.use((req, res, next) => {
  const mutableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutableMethods.includes(req.method)) {
    validateOrigin(req, res, () => {
      validateCSRF(req, res, next);
    });
  } else {
    next();
  }
});

// Rotas para administradores
router.post('/', authorize('ADMIN'), weeklyBlockController.createWeeklyBlock.bind(weeklyBlockController));
router.get('/', authorize('ADMIN'), weeklyBlockController.getAllWeeklyBlocks.bind(weeklyBlockController));
router.get('/active', weeklyBlockController.getActiveWeeklyBlocks.bind(weeklyBlockController));
router.get('/stats', authorize('ADMIN'), weeklyBlockController.getWeeklyBlockStats.bind(weeklyBlockController));
router.put('/:id', authorize('ADMIN'), weeklyBlockController.updateWeeklyBlock.bind(weeklyBlockController));
router.delete('/:id', authorize('ADMIN'), weeklyBlockController.deleteWeeklyBlock.bind(weeklyBlockController));

export default router;


