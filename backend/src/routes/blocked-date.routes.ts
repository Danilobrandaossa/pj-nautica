import { Router } from 'express';
import { BlockedDateController } from '../controllers/blocked-date.controller';
import { authenticate, isAdmin } from '../middleware/auth';
import { validateCSRF, validateOrigin } from '../middleware/csrf';

const router = Router();
const blockedDateController = new BlockedDateController();

// Todas as rotas requerem autenticação
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

// Visualização para todos
router.get('/', blockedDateController.findAll.bind(blockedDateController));
router.get('/:id', blockedDateController.findById.bind(blockedDateController));

// Apenas Admin pode criar e deletar
router.post('/', isAdmin, blockedDateController.create.bind(blockedDateController));
router.delete('/:id', isAdmin, blockedDateController.delete.bind(blockedDateController));

export default router;



