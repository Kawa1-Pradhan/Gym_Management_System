import express from 'express';
import sessionController from '../controllers/sessionController.js';
import { requireAuth, requireStaffOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All session routes require staff or admin access
router.use(requireAuth, requireStaffOrAdmin);

// Boxing session routes
router.get('/boxing', sessionController.getBoxingSessions);
router.post('/boxing', sessionController.createBoxingSession);
router.put('/boxing/:id', sessionController.updateBoxingSession);
router.patch('/boxing/:id/cancel', sessionController.cancelBoxingSession);
router.delete('/boxing/:id', sessionController.deleteBoxingSession);

// Sauna session routes
router.get('/sauna', sessionController.getSaunaSessions);
router.post('/sauna', sessionController.createSaunaSession);
router.put('/sauna/:id', sessionController.updateSaunaSession);
router.patch('/sauna/:id/cancel', sessionController.cancelSaunaSession);
router.delete('/sauna/:id', sessionController.deleteSaunaSession);

export default router;