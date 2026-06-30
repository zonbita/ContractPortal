import { Router } from 'express';
import {
  getUsers,
  getConversations,
  getMessages,
  postMessage,
  markRead,
  getUnreadCount,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/users', getUsers);
router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.get('/messages/:userId', getMessages);
router.post('/messages/:userId', postMessage);
router.patch('/messages/:userId/read', markRead);

export default router;
