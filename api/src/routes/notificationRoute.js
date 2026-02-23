import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { requireAuth, requireMember } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, notificationController.getMyNotifications);
router.patch('/:id/read', requireAuth, notificationController.markRead);
router.patch('/read-all', requireAuth, notificationController.markAllRead);

export default router;
