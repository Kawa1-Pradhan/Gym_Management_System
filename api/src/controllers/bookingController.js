import Booking from "../models/Booking.js";
import boxingService from "../services/boxingService.js";
import saunaService from "../services/saunaService.js";

// Get all active boxing sessions (public/member accessible)
const getActiveBoxingSessions = async (req, res) => {
  try {
    const sessions = await boxingService.getAllSessions();
    const activeSessions = sessions.filter(s => s.status === "Active" && s.availableSlots > 0);
    res.json(activeSessions);
  } catch (error) {
    console.error("Error fetching active boxing sessions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all active sauna sessions (public/member accessible)
const getActiveSaunaSessions = async (req, res) => {
  try {
    const sessions = await saunaService.getAllSessions();
    const activeSessions = sessions.filter(s => s.status === "Active" && s.availableSlots > 0);
    res.json(activeSessions);
  } catch (error) {
    console.error("Error fetching active sauna sessions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Book a boxing session (member only)
const bookBoxingSession = async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    // Determine target member: Staff/Admin can book for anyone; Members book for themselves.
    const isStaffOrAdmin = req.user.role.includes('STAFF') || req.user.role.includes('ADMIN');
    const memberId = (isStaffOrAdmin && req.body.memberId) ? req.body.memberId : req.user.id;

    // 1. Check for existing active booking
    const existing = await Booking.findOne({
      memberId,
      sessionId,
      sessionType: "Boxing",
      status: "Booked"
    });

    if (existing) {
      return res.status(400).json({ message: "You have already booked this session" });
    }

    // 2. Use service to update session slots
    await boxingService.bookSession(sessionId, memberId);

    // 3. Create record in Booking collection
    try {
      const booking = new Booking({
        memberId,
        sessionId,
        sessionType: "Boxing",
        status: "Booked"
      });
      await booking.save();
      await booking.populate('memberId', 'name email');
      res.status(201).json({ message: "Booking successful", booking });
    } catch (dbError) {
      // Rollback session slots if booking save fails
      await boxingService.cancelBooking(sessionId, memberId);
      throw dbError;
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already booked this session" });
    }
    console.error("Error booking boxing session:", error);

    if (error.message === "Session not found") {
      return res.status(404).json({ message: error.message });
    }
    if (["Session is full", "Already booked", "You have already booked this session", "Session is not active or has been cancelled"].includes(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Book a sauna session (member only)
const bookSaunaSession = async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    // Determine target member
    const isStaffOrAdmin = req.user.role.includes('STAFF') || req.user.role.includes('ADMIN');
    const memberId = (isStaffOrAdmin && req.body.memberId) ? req.body.memberId : req.user.id;

    // 1. Check for existing active booking
    const existing = await Booking.findOne({
      memberId,
      sessionId,
      sessionType: "Sauna",
      status: "Booked"
    });

    if (existing) {
      return res.status(400).json({ message: "You have already booked this session" });
    }

    // 2. Use service
    await saunaService.bookSession(sessionId, memberId);

    // 3. Create record
    try {
      const booking = new Booking({
        memberId,
        sessionId,
        sessionType: "Sauna",
        status: "Booked"
      });
      await booking.save();
      await booking.populate('memberId', 'name email');
      res.status(201).json({ message: "Booking successful", booking });
    } catch (dbError) {
      // Rollback
      await saunaService.cancelBooking(sessionId, memberId);
      throw dbError;
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already booked this session" });
    }
    console.error("Error booking sauna session:", error);

    if (error.message === "Session not found") {
      return res.status(404).json({ message: error.message });
    }
    if (["Session is full", "Already booked", "You have already booked this session", "Session is not active or has been cancelled"].includes(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get current member's bookings
const getMyBookings = async (req, res) => {
  try {
    const memberId = req.user.id;

    const bookings = await Booking.find({
      memberId,
      status: "Booked"
    })
      .sort({ bookingDate: -1 });

    // Populate session details based on session type
    const populatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const bookingObj = booking.toObject();

        if (booking.sessionType === "Boxing") {
          bookingObj.sessionDetails = await boxingService.getSessionById(booking.sessionId);
        } else if (booking.sessionType === "Sauna") {
          bookingObj.sessionDetails = await saunaService.getSessionById(booking.sessionId);
        }

        return bookingObj;
      })
    );

    res.json(populatedBookings);
  } catch (error) {
    console.error("Error fetching member bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    // For members, verify ownership. For staff/admin, allow any.
    let query = { _id: bookingId };
    if (!req.user.role.includes('STAFF') && !req.user.role.includes('ADMIN')) {
      query.memberId = req.user.id;
    }

    const booking = await Booking.findOne(query).populate('memberId', 'name email');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "Cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Update booking status
    booking.status = "Cancelled";
    await booking.save();

    // Use service to update session slots/members
    if (booking.sessionType === "Boxing") {
      await boxingService.cancelBooking(booking.sessionId, booking.memberId._id);
    } else if (booking.sessionType === "Sauna") {
      await saunaService.cancelBooking(booking.sessionId, booking.memberId._id);
    }

    // Notify user if cancelled by Admin or Staff
    const isSelfCancel = req.user.id.toString() === booking.memberId._id.toString();
    if (!isSelfCancel) {
      const { sendBookingCancellationEmail } = await import("../utils/mail.js");

      // Get session details for the email
      let sessionDetails;
      if (booking.sessionType === "Boxing") {
        sessionDetails = await boxingService.getSessionById(booking.sessionId);
      } else {
        sessionDetails = await saunaService.getSessionById(booking.sessionId);
      }

      if (sessionDetails) {
        sendBookingCancellationEmail(
          booking.memberId.email,
          booking.memberId.name,
          {
            name: sessionDetails.name,
            date: sessionDetails.date ? new Date(sessionDetails.date).toLocaleDateString() : 'N/A',
            startTime: sessionDetails.startTime || 'N/A'
          }
        );
      }
    }

    res.json({
      message: isSelfCancel ? "Booking cancelled successfully" : "Member booking cancelled by administrator",
      booking
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('memberId', 'name email')
      .sort({ bookingDate: -1 });

    // Populate session details based on session type
    const populatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const bookingObj = booking.toObject();

        if (booking.sessionType === "Boxing") {
          bookingObj.sessionDetails = await boxingService.getSessionById(booking.sessionId);
        } else if (booking.sessionType === "Sauna") {
          bookingObj.sessionDetails = await saunaService.getSessionById(booking.sessionId);
        }

        return bookingObj;
      })
    );

    res.json(populatedBookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  getActiveBoxingSessions,
  getActiveSaunaSessions,
  bookBoxingSession,
  bookSaunaSession,
  getMyBookings,
  getAllBookings,
  cancelBooking
};