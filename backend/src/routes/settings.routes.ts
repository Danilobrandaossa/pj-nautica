import { Router } from 'express';
import settingsController from '../controllers/settings.controller';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, isAdmin);

router.get('/', settingsController.list);
router.post('/', settingsController.upsert);

export default router;





