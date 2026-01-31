import express from 'express';
import bookingController from '../controllers/bookingController.js';
import { requireAuth, requireMember } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public/Member routes - Get active sessions
router.get('/sessions/boxing/active', bookingController.getActiveBoxingSessions);
router.get('/sessions/sauna/active', bookingController.getActiveSaunaSessions);

// Member-only routes - Booking management
router.post('/boxing/:id', requireAuth, requireMember, bookingController.bookBoxingSession);
router.post('/sauna/:id', requireAuth, requireMember, bookingController.bookSaunaSession);
router.get('/my-bookings', requireAuth, requireMember, bookingController.getMyBookings);
router.delete('/:id', requireAuth, requireMember, bookingController.cancelBooking);

export default router;