import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();
const notificationController = new NotificationController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas para usuários autenticados
router.get('/my-notifications', notificationController.findByUser.bind(notificationController));
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));
router.post('/:id/read', notificationController.markAsRead.bind(notificationController));
router.post('/read-all', notificationController.markAllAsRead.bind(notificationController));

// Rotas apenas para Admin
router.post('/', isAdmin, notificationController.create.bind(notificationController));
router.get('/', isAdmin, notificationController.findAll.bind(notificationController));
router.put('/:id', isAdmin, notificationController.update.bind(notificationController));
router.delete('/:id', isAdmin, notificationController.delete.bind(notificationController));

export default router;



