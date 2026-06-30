import { Router } from 'express';
import {
  getContracts,
  getContractById,
  createContractHandler,
  updateContractHandler,
  deleteContractHandler,
  updateContractStatusHandler,
} from '../controllers/contractController.js';
import { protect, staffOrAbove, managerOrAbove } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.get('/', getContracts);
router.get('/:id', getContractById);
router.post('/', staffOrAbove, upload.array('files', 10), createContractHandler);
router.put('/:id', staffOrAbove, upload.array('files', 10), updateContractHandler);
router.patch('/:id/status', staffOrAbove, updateContractStatusHandler);
router.delete('/:id', managerOrAbove, deleteContractHandler);

export default router;
