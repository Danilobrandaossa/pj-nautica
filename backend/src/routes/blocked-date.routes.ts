import { Router } from 'express';
import { BlockedDateController } from '../controllers/blocked-date.controller';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();
const blockedDateController = new BlockedDateController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Visualização para todos
router.get('/', blockedDateController.findAll.bind(blockedDateController));
router.get('/:id', blockedDateController.findById.bind(blockedDateController));

// Apenas Admin pode criar e deletar
router.post('/', isAdmin, blockedDateController.create.bind(blockedDateController));
router.delete('/:id', isAdmin, blockedDateController.delete.bind(blockedDateController));

export default router;



