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
    const memberId = req.user.id;

    // Use service to handle business logic
    await boxingService.bookSession(sessionId, memberId);

    // Create record in Booking collection
    const booking = new Booking({
      memberId,
      sessionId,
      sessionType: "Boxing",
      status: "Booked"
    });

    await booking.save();
    await booking.populate('memberId', 'name email');

    res.status(201).json({
      message: "Booking successful",
      booking
    });
  } catch (error) {
    console.error("Error booking boxing session:", error);

    if (error.message === "Session not found") {
      return res.status(404).json({ message: error.message });
    }
    if (["Session is full", "Already booked", "You have already booked this session", "Session is not active or has been cancelled"].includes(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    // Handle duplicate key error from unique index
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already booked this session" });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Book a sauna session (member only)
const bookSaunaSession = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const memberId = req.user.id;

    // Use service to handle business logic
    await saunaService.bookSession(sessionId, memberId);

    // Create record in Booking collection
    const booking = new Booking({
      memberId,
      sessionId,
      sessionType: "Sauna",
      status: "Booked"
    });

    await booking.save();
    await booking.populate('memberId', 'name email');

    res.status(201).json({
      message: "Booking successful",
      booking
    });
  } catch (error) {
    console.error("Error booking sauna session:", error);

    if (error.message === "Session not found") {
      return res.status(404).json({ message: error.message });
    }
    if (["Session is full", "Already booked", "You have already booked this session", "Session is not active or has been cancelled"].includes(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    // Handle duplicate key error from unique index
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already booked this session" });
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
    const memberId = req.user.id;

    // Find booking and verify it belongs to the member
    const booking = await Booking.findOne({
      _id: bookingId,
      memberId
    });

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
      await boxingService.cancelBooking(booking.sessionId, memberId);
    } else if (booking.sessionType === "Sauna") {
      await saunaService.cancelBooking(booking.sessionId, memberId);
    }

    res.json({
      message: "Booking cancelled successfully",
      booking
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  getActiveBoxingSessions,
  getActiveSaunaSessions,
  bookBoxingSession,
  bookSaunaSession,
  getMyBookings,
  cancelBooking
};