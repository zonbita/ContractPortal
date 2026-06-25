import { Router } from 'express';
import {
  getContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  updateContractStatus,
} from '../controllers/contractController.js';
import { protect, staffOrAbove, managerOrAbove } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.get('/', getContracts);
router.get('/:id', getContract);
router.post('/', staffOrAbove, upload.array('files', 10), createContract);
router.put('/:id', staffOrAbove, upload.array('files', 10), updateContract);
router.patch('/:id/status', staffOrAbove, updateContractStatus);
router.delete('/:id', managerOrAbove, deleteContract);

export default router;
