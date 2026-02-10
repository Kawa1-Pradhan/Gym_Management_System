import express from 'express';
import bookingController from '../controllers/bookingController.js';
import { requireAuth, requireMember, requireActiveMember } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public/Member routes - Get active sessions
router.get('/sessions/boxing/active', bookingController.getActiveBoxingSessions);
router.get('/sessions/sauna/active', bookingController.getActiveSaunaSessions);

// Member-centric routes - Booking management (Now staff accessible for administrative booking)
router.post('/boxing/:id', requireAuth, bookingController.bookBoxingSession);
router.post('/sauna/:id', requireAuth, bookingController.bookSaunaSession);
router.get('/my-bookings', requireAuth, requireMember, bookingController.getMyBookings);

// Staff/Admin routes
router.get('/', requireAuth, bookingController.getAllBookings);
router.delete('/:id', requireAuth, bookingController.cancelBooking);

export default router;