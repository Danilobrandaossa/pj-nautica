import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, isAdmin } from '../middleware/auth';
import { validateCSRF, validateOrigin } from '../middleware/csrf';
import { passwordChangeLimiter, userMutationLimiter } from '../middleware/rate-limiter';

const router = Router();
const userController = new UserController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Middleware CSRF para rotas mutáveis (POST, PUT, PATCH, DELETE)
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

// Rota para alterar própria senha
router.post('/change-password', passwordChangeLimiter, userController.changePassword.bind(userController));

// Rotas apenas para Admin
router.post('/', isAdmin, userMutationLimiter, userController.create.bind(userController));
router.get('/', isAdmin, userController.findAll.bind(userController));
router.get('/:id', isAdmin, userController.findById.bind(userController));
router.put('/:id', isAdmin, userMutationLimiter, userController.update.bind(userController));
router.delete('/:id', isAdmin, userMutationLimiter, userController.delete.bind(userController));

export default router;



