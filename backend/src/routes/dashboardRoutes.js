import { Router } from 'express';
import { getDashboardStats, getUpcomingExpirationsList } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/upcoming-expirations', getUpcomingExpirationsList);

export default router;
