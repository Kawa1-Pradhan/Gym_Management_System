import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { requireAuth, requireMember } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, requireMember, notificationController.getMyNotifications);
router.patch('/:id/read', requireAuth, requireMember, notificationController.markRead);
router.patch('/read-all', requireAuth, requireMember, notificationController.markAllRead);

export default router;
