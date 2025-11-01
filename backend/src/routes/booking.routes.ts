import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticate, isAdmin } from '../middleware/auth';
import { validateCSRF, validateOrigin } from '../middleware/csrf';
import { bookingMutationLimiter } from '../middleware/rate-limiter';

const router = Router();
const bookingController = new BookingController();

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

// Rotas acessíveis para usuários autenticados
router.post('/', bookingMutationLimiter, bookingController.create.bind(bookingController));
router.get('/', bookingController.findAll.bind(bookingController));
router.get('/:id', bookingController.findById.bind(bookingController));
router.get('/calendar/:vesselId', bookingController.getCalendar.bind(bookingController));
router.post('/:id/cancel', bookingMutationLimiter, bookingController.cancel.bind(bookingController));

// Rotas apenas para Admin
router.put('/:id/status', isAdmin, bookingMutationLimiter, bookingController.updateStatus.bind(bookingController));
router.delete('/:id', isAdmin, bookingMutationLimiter, bookingController.delete.bind(bookingController));

export default router;



