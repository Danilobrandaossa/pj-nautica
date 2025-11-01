import { Router } from 'express';
import { WeeklyBlockController } from '../controllers/weekly-block.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const weeklyBlockController = new WeeklyBlockController();

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas para administradores
router.post('/', authorize('ADMIN'), weeklyBlockController.createWeeklyBlock.bind(weeklyBlockController));
router.get('/', authorize('ADMIN'), weeklyBlockController.getAllWeeklyBlocks.bind(weeklyBlockController));
router.get('/active', weeklyBlockController.getActiveWeeklyBlocks.bind(weeklyBlockController));
router.get('/stats', authorize('ADMIN'), weeklyBlockController.getWeeklyBlockStats.bind(weeklyBlockController));
router.put('/:id', authorize('ADMIN'), weeklyBlockController.updateWeeklyBlock.bind(weeklyBlockController));
router.delete('/:id', authorize('ADMIN'), weeklyBlockController.deleteWeeklyBlock.bind(weeklyBlockController));

export default router;


