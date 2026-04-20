import Booking from "../models/Booking.js";
import boxingService from "../services/boxingService.js";
import saunaService from "../services/saunaService.js";
import notificationService from "../services/notificationService.js";
import { awardPoints } from "./achievementController.js";
import PointRule from "../models/PointRule.js";

// Get all active boxing sessions (public/member accessible)
const getActiveBoxingSessions = async (req, res) => {
  try {
    const sessions = await boxingService.getAllSessions();
    const activeSessions = sessions.filter(s => 
      s.status === "Active" && 
      (s.bookings ? s.bookings.length : 0) < s.maxCapacity
    );
    res.json(activeSessions);
  } catch (error) {
    console.error("DEBUG: bookBoxingSession error detail:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all active sauna sessions (public/member accessible)
const getActiveSaunaSessions = async (req, res) => {
  try {
    const sessions = await saunaService.getAllSessions();
    const activeSessions = sessions.filter(s => 
      s.status === "Active" && 
      (s.bookings ? s.bookings.length : 0) < s.maxCapacity
    );
    res.json(activeSessions);
  } catch (error) {
    console.error("Error fetching active sauna sessions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Book a boxing session (member only)
const bookBoxingSession = async (req, res) => {
  console.log(">>> [DEBUG] bookBoxingSession CALLED with params:", req.params);
  try {
    const { id: sessionId } = req.params;
    const isStaffOrAdmin = req.user?.role?.includes('STAFF') || req.user?.role?.includes('ADMIN');
    const memberId = (isStaffOrAdmin && req.body.memberId) ? req.body.memberId : (req.user?.id || req.user?._id);

    console.log(">>> [DEBUG] isStaffOrAdmin:", isStaffOrAdmin, "memberId:", memberId);

    // 0. Validate IDs
    if (!sessionId || sessionId === 'undefined') {
      console.log(">>> [DEBUG] Fail: Invalid Session ID");
      return res.status(400).json({ message: "Invalid Session ID. Please refresh and try again." });
    }
    if (!memberId) {
      console.log(">>> [DEBUG] Fail: No memberId found in req.user");
      return res.status(401).json({ message: "Identification failed. Please log in again." });
    }

    // 1. Check for existing active booking
    const existing = await Booking.findOne({
      memberId,
      sessionId,
      sessionType: "Boxing",
      status: "Booked"
    });

    if (existing) {
      console.log(">>> [DEBUG] Fail: Already booked");
      return res.status(400).json({ message: "You have already booked this session" });
    }

    // 2. Use service to update session slots
    console.log(">>> [DEBUG] Calling boxingService.bookSession...");
    await boxingService.bookSession(sessionId, memberId);

    // 3. Create record in Booking collection
    try {
      console.log(">>> [DEBUG] Creating Booking record...");
      const booking = new Booking({
        memberId,
        sessionId,
        sessionType: "Boxing",
        status: "Booked"
      });
      await booking.save();
      await booking.populate('memberId', 'name email');

      // 4. Create Notification
      console.log(">>> [DEBUG] Creating Notification...");
      const session = await boxingService.getSessionById(sessionId);
      if (session) {
        await notificationService.createNotification(
          memberId,
          "Booking Confirmed",
          `Your boxing session "${session.name}" has been booked successfully.`,
          "booking"
        );
      }

      console.log(">>> [DEBUG] Success! Sending response.");
      return res.status(201).json({ message: "Booking successful", booking });

    } catch (dbError) {
      console.error(">>> [DEBUG] DB ERROR:", dbError);
      // Rollback session slots if booking save fails
      try { await boxingService.cancelBooking(sessionId, memberId); } catch (e) {}
      return res.status(400).json({ message: dbError.message || "Failed to finalize booking record" });
    }
  } catch (error) {
    console.error(">>> [DEBUG] TOP-LEVEL ERROR:", error);
    let status = 500;
    let message = error.message || "Unknown server error during booking";

    if (error.code === 11000) {
      status = 400;
      message = "You have already booked this session.";
    } else if (message.includes('full') || message.includes('not active') || message.includes('already booked')) {
      status = 400;
    } else if (message.includes('not found')) {
      status = 404;
    }
    return res.status(status).json({ message });
  }
};

// Book a sauna session (member only)
const bookSaunaSession = async (req, res) => {
  console.log(">>> [DEBUG] bookSaunaSession CALLED with params:", req.params);
  try {
    const { id: sessionId } = req.params;
    const isStaffOrAdmin = req.user?.role?.includes('STAFF') || req.user?.role?.includes('ADMIN');
    const memberId = (isStaffOrAdmin && req.body.memberId) ? req.body.memberId : (req.user?.id || req.user?._id);

    console.log(">>> [DEBUG] isStaffOrAdmin:", isStaffOrAdmin, "memberId:", memberId);

    // 0. Validate IDs
    if (!sessionId || sessionId === 'undefined') {
      console.log(">>> [DEBUG] Fail: Invalid Session ID");
      return res.status(400).json({ message: "Invalid Session ID. Please refresh and try again." });
    }
    if (!memberId) {
      console.log(">>> [DEBUG] Fail: No memberId found in req.user");
      return res.status(401).json({ message: "Identification failed. Please log in again." });
    }

    // 1. Check for existing active booking
    const existing = await Booking.findOne({
      memberId,
      sessionId,
      sessionType: "Sauna",
      status: "Booked"
    });

    if (existing) {
      console.log(">>> [DEBUG] Fail: Already booked");
      return res.status(400).json({ message: "You have already booked this session" });
    }

    // 2. Use service to update session slots
    console.log(">>> [DEBUG] Calling saunaService.bookSession...");
    await saunaService.bookSession(sessionId, memberId);

    // 3. Create record in Booking collection
    try {
      console.log(">>> [DEBUG] Creating Booking record...");
      const booking = new Booking({
        memberId,
        sessionId,
        sessionType: "Sauna",
        status: "Booked"
      });
      await booking.save();
      await booking.populate('memberId', 'name email');

      // 4. Create Notification
      console.log(">>> [DEBUG] Creating Notification...");
      const session = await saunaService.getSessionById(sessionId);
      if (session) {
        await notificationService.createNotification(
          memberId,
          "Booking Confirmed",
          `Your sauna session "${session.name}" has been booked successfully.`,
          "booking"
        );
      }

      console.log(">>> [DEBUG] Success! Sending response.");
      return res.status(201).json({ message: "Booking successful", booking });

    } catch (dbError) {
      console.error(">>> [DEBUG] DB ERROR:", dbError);
      // Rollback session slots if booking save fails
      try { await saunaService.cancelBooking(sessionId, memberId); } catch (e) {}
      return res.status(400).json({ message: dbError.message || "Failed to finalize booking record" });
    }
  } catch (error) {
    console.error(">>> [DEBUG] TOP-LEVEL ERROR:", error);
    let status = 500;
    let message = error.message || "Unknown server error during booking";

    if (error.code === 11000) {
      status = 400;
      message = "You have already booked this session.";
    } else if (message.includes('full') || message.includes('not active') || message.includes('already booked')) {
      status = 400;
    } else if (message.includes('not found')) {
      status = 404;
    }
    return res.status(status).json({ message });
  }
};

// Get current member's bookings
const getMyBookings = async (req, res) => {
  try {
    const memberId = req.user?.id || req.user?._id;
    if (!memberId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const bookings = await Booking.find({ memberId }).sort({ bookingDate: -1 });

    // Populate session details based on session type
    const populatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const bookingObj = booking.toObject();

        try {
          if (booking.sessionType === "Boxing") {
            bookingObj.sessionDetails = await boxingService.getSessionById(booking.sessionId);
          } else if (booking.sessionType === "Sauna") {
            bookingObj.sessionDetails = await saunaService.getSessionById(booking.sessionId);
          }
        } catch (err) {
          console.warn(`[GetMyBookings] Could not populate session details for booking ${booking._id}:`, err.message);
          bookingObj.sessionDetails = null;
        }

        return bookingObj;
      })
    );

    res.json(populatedBookings);
  } catch (error) {
    console.error("DEBUG: getMyBookings CRASH:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    const isStaffOrAdmin = req.user?.role?.includes('STAFF') || req.user?.role?.includes('ADMIN');
    // For members, verify ownership. For staff/admin, allow any.
    let query = { _id: bookingId };
    if (!isStaffOrAdmin) {
      query.memberId = req.user?.id || req.user?._id;
    }

    const booking = await Booking.findOne(query).populate('memberId', 'name email');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "Cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Update booking status
    console.log(`[CancelBooking] Marking booking ${bookingId} as Cancelled`);
    booking.status = "Cancelled";
    await booking.save();

    // Use service to update session slots/members
    if (!booking.sessionId || !booking.memberId) {
      console.warn(`[CancelBooking] Missing sessionId or memberId on booking object. Skipping session update.`);
    } else {
      console.log(`[CancelBooking] Updating session slots for ${booking.sessionType} session ${booking.sessionId}`);
      const memberIdToUse = booking.memberId._id || booking.memberId;

      try {
        if (booking.sessionType === "Boxing") {
          await boxingService.cancelBooking(booking.sessionId, memberIdToUse);
        } else if (booking.sessionType === "Sauna") {
          await saunaService.cancelBooking(booking.sessionId, memberIdToUse);
        }
      } catch (serviceErr) {
        console.error(`[CancelBooking] Error in service cancelBooking:`, serviceErr);
        // Non-fatal if the booking status was already saved
      }
    }

    // Notify user if cancelled by Admin or Staff
    const memberIdForNotif = booking.memberId?._id || booking.memberId;
    const isSelfCancel = req.user?.id?.toString() === memberIdForNotif?.toString();
    
    if (!isSelfCancel && booking.memberId?.email) {
      try {
        const { sendBookingCancellationEmail } = await import("../utils/mail.js");

        // Get session details for the email
        let sessionDetails;
        if (booking.sessionType === "Boxing") {
          sessionDetails = await boxingService.getSessionById(booking.sessionId);
        } else {
          sessionDetails = await saunaService.getSessionById(booking.sessionId);
        }

        if (sessionDetails) {
          await sendBookingCancellationEmail(
            booking.memberId.email,
            booking.memberId.name,
            {
              name: sessionDetails.name,
              date: sessionDetails.date ? new Date(sessionDetails.date).toLocaleDateString() : 'N/A',
              startTime: sessionDetails.startTime || 'N/A'
            }
          );
        }

        // Create In-App Notification
        await notificationService.createNotification(
          memberIdForNotif,
          "Booking Cancelled",
          `Your booking for "${sessionDetails ? sessionDetails.name : 'session'}" has been cancelled by an administrator.`,
          "booking"
        );
      } catch (notifError) {
        console.error("[CancelBooking] Failed to send cancellation notification:", notifError);
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

// Permanently delete a booking record (Delete history log)
const deleteBookingRecord = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    const isStaffOrAdmin = req.user?.role?.includes('STAFF') || req.user?.role?.includes('ADMIN');
    let query = { _id: bookingId };
    if (!isStaffOrAdmin) {
      query.memberId = req.user?.id || req.user?._id;
    }

    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({ message: "History record not found" });
    }

    if (booking.status === "Booked" && !isStaffOrAdmin) {
      return res.status(400).json({ message: "Active bookings must be cancelled before deletion from history" });
    }

    await Booking.findByIdAndDelete(bookingId);
    res.json({ message: "History record removed successfully" });
  } catch (error) {
    console.error("Error deleting booking record:", error);
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
  cancelBooking,
  deleteBookingRecord
};