import { Router } from 'express';
import {
  getAppendices,
  createAppendix,
  updateAppendix,
  deleteAppendix,
} from '../controllers/appendixController.js';
import { protect, staffOrAbove, managerOrAbove } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router({ mergeParams: true });

router.use(protect);

router.get('/', getAppendices);
router.post('/', staffOrAbove, upload.array('files', 10), createAppendix);
router.put('/:id', staffOrAbove, upload.array('files', 10), updateAppendix);
router.delete('/:id', managerOrAbove, deleteAppendix);

export default router;
