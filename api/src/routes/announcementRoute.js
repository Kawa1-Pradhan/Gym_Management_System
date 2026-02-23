import express from 'express';
import announcementController from '../controllers/announcementController.js';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, announcementController.getAnnouncements);
router.post('/', requireAuth, requireAdmin, announcementController.createAnnouncement);
router.delete('/:id', requireAuth, requireAdmin, announcementController.deleteAnnouncement);

export default router;
