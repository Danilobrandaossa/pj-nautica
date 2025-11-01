import { Router } from 'express';
import { VesselController } from '../controllers/vessel.controller';
import { authenticate, isAdmin } from '../middleware/auth';
import { validateCSRF, validateOrigin } from '../middleware/csrf';

const router = Router();
const vesselController = new VesselController();

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

// Rotas acessíveis para usuários autenticados
router.get('/', vesselController.findAll.bind(vesselController));
router.get('/my-vessels', vesselController.findByUser.bind(vesselController));
router.get('/:id', vesselController.findById.bind(vesselController));

// Rotas apenas para Admin
router.post('/', isAdmin, vesselController.create.bind(vesselController));
router.put('/:id', isAdmin, vesselController.update.bind(vesselController));
router.delete('/:id', isAdmin, vesselController.delete.bind(vesselController));
router.post('/:id/users', isAdmin, vesselController.addUser.bind(vesselController));
router.delete('/:id/users/:userId', isAdmin, vesselController.removeUser.bind(vesselController));

export default router;



