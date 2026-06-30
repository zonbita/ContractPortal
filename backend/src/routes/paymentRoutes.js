import { Router } from 'express';
import {
  createPaymentHandler,
  deletePaymentHandler,
  getPayments,
  getPaymentsSummary,
} from '../controllers/paymentController.js';
import { protect, staffOrAbove, managerOrAbove } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getPayments);
router.get('/summary', getPaymentsSummary);
router.post('/', staffOrAbove, createPaymentHandler);
router.delete('/:id', managerOrAbove, deletePaymentHandler);

export default router;
