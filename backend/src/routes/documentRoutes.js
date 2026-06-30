import { Router } from 'express';
import {
  getDocuments,
  getDocument,
  createDocumentHandler,
  updateDocumentHandler,
  deleteDocumentHandler,
  updateDocumentStatusHandler,
  updateOcrMetadataHandler,
  updateVersionOcrMetadataHandler,
  searchDocumentsHandler,
  runOcrHandler,
  runVersionOcrHandler,
  getActivityLogs,
  getComments,
  addComment,
  deleteComment,
  addVersionHandler,
  deleteVersionHandler,
  renameVersionHandler,
} from '../controllers/documentController.js';
import { protect, staffOrAbove, managerOrAbove } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.get('/search', searchDocumentsHandler);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.post('/', staffOrAbove, upload.array('files', 10), createDocumentHandler);
router.put('/:id', staffOrAbove, upload.array('files', 10), updateDocumentHandler);
router.patch('/:id/status', staffOrAbove, updateDocumentStatusHandler);
router.patch('/:id/ocr-metadata', staffOrAbove, updateOcrMetadataHandler);
router.patch('/:id/versions/:versionId/ocr-metadata', staffOrAbove, updateVersionOcrMetadataHandler);
router.delete('/:id', managerOrAbove, deleteDocumentHandler);
router.post('/:id/ocr', staffOrAbove, runOcrHandler);
router.post('/:id/versions/:versionId/ocr', staffOrAbove, runVersionOcrHandler);
router.get('/:id/activity', getActivityLogs);
router.get('/:id/comments', getComments);
router.post('/:id/comments', staffOrAbove, addComment);
router.delete('/:id/comments/:commentId', managerOrAbove, deleteComment);
router.post('/:id/versions', staffOrAbove, upload.single('file'), addVersionHandler);
router.patch('/:id/versions/:versionId', staffOrAbove, renameVersionHandler);
router.delete('/:id/versions/:versionId', staffOrAbove, deleteVersionHandler);

export default router;
