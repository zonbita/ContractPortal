import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { protect, staffOrAbove, managerOrAbove } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', staffOrAbove, createCustomer);
router.put('/:id', staffOrAbove, updateCustomer);
router.delete('/:id', managerOrAbove, deleteCustomer);

export default router;
