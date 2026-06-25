import { Router } from 'express';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  listUsers,
  updateUserRole,
} from '../controllers/authController.js';
import { protect, adminOnly, managerOrAbove } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.get('/users', protect, adminOnly, listUsers);
router.put('/users/:id/role', protect, managerOrAbove, updateUserRole);

export default router;
