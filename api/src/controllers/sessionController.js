import boxingService from "../services/boxingService.js";
import saunaService from "../services/saunaService.js";
import { verifyJWT } from "../utils/jwt.js";

// Get current staff ID from token and check role
const getStaffIdFromToken = async (req) => {
  // Try cookies first (for backward compatibility)
  let token = req.cookies?.token;

  // If no cookie token, try authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = await verifyJWT(token);

    // Check if user has STAFF or ADMIN role
    // Handle both string and array formats
    if (!decoded.role) {
      return null;
    }

    let hasAccess = false;

    if (Array.isArray(decoded.role)) {
      // Role is an array: check if it includes STAFF or ADMIN
      hasAccess = decoded.role.includes('STAFF') || decoded.role.includes('ADMIN');
    } else if (typeof decoded.role === 'string') {
      // Role is a string: check if it's STAFF or ADMIN
      hasAccess = decoded.role === 'STAFF' || decoded.role === 'ADMIN';
    }

    if (!hasAccess) {
      return null;
    }

    return decoded.id;
  } catch (error) {
    console.error('❌ Error verifying token:', error);
    return null;
  }
};

// Boxing Sessions

// Get all boxing sessions
const getBoxingSessions = async (req, res) => {
  try {
    const staffId = await getStaffIdFromToken(req);
    if (!staffId) {
      return res.status(403).json({ message: "Access denied. Staff or Admin only." });
    }

    const sessions = await boxingService.getAllSessions();
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching boxing sessions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create new boxing session
const createBoxingSession = async (req, res) => {
  try {
    const staffId = await getStaffIdFromToken(req);
    if (!staffId) {
      return res.status(403).json({ message: "Access denied. Staff or Admin only." });
    }

    const session = await boxingService.createSession(req.body, staffId);
    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating boxing session:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update boxing session
const updateBoxingSession = async (req, res) => {
  try {
    const staffId = await getStaffIdFromToken(req);
    if (!staffId) {
      return res.status(403).json({ message: "Access denied. Staff or Admin only." });
    }

    const { id } = req.params;
    const session = await boxingService.updateSession(id, req.body);
    res.json(session);
  } catch (error) {
    console.error("Error updating boxing session:", error);
    if (error.message === "Session not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel boxing session
const cancelBoxingSession = async (req, res) => {
  try {
    const staffId = await getStaffIdFromToken(req);
    if (!staffId) {
      return res.status(403).json({ message: "Access denied. Staff or Admin only." });
    }

    const { id } = req.params;
    const session = await boxingService.cancelSession(id);
    res.json(session);
  } catch (error) {
    console.error("Error cancelling boxing session:", error);
    if (error.message === "Session not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete boxing session
const deleteBoxingSession = async (req, res) => {
  try {
    const staffId = await getStaffIdFromToken(req);
    if (!staffId) {
      return res.status(403).json({ message: "Access denied. Staff or Admin only." });
    }

    const { id } = req.params;
    await boxingService.deleteSession(id);
    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting boxing session:", error);
    if (error.message === "Session not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Sauna Sessions

// Get all sauna sessions
const getSaunaSessions = async (req, res) => {
  try {
    const staffId = await getStaffIdFromToken(req);
    if (!staffId) {
      return res.status(403).json({ message: "Access denied. Staff or Admin only." });
    }

    const sessions = await saunaService.getAllSessions();
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching sauna sessions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create new sauna session
const createSaunaSession = async (req, res) => {
  try {
    const staffId = await getStaffIdFromToken(req);
    if (!staffId) {
      return res.status(403).json({ message: "Access denied. Staff or Admin only." });
    }

    const session = await saunaService.createSession(req.body, staffId);
    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating sauna session:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update sauna session
const updateSaunaSession = async (req, res) => {
  try {
    const staffId = await getStaffIdFromToken(req);
    if (!staffId) {
      return res.status(403).json({ message: "Access denied. Staff or Admin only." });
    }

    const { id } = req.params;
    const session = await saunaService.updateSession(id, req.body);
    res.json(session);
  } catch (error) {
    console.error("Error updating sauna session:", error);
    if (error.message === "Session not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel sauna session
const cancelSaunaSession = async (req, res) => {
  try {
    const staffId = await getStaffIdFromToken(req);
    if (!staffId) {
      return res.status(403).json({ message: "Access denied. Staff or Admin only." });
    }

    const { id } = req.params;
    const session = await saunaService.cancelSession(id);
    res.json(session);
  } catch (error) {
    console.error("Error cancelling sauna session:", error);
    if (error.message === "Session not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete sauna session
const deleteSaunaSession = async (req, res) => {
  try {
    const staffId = await getStaffIdFromToken(req);
    if (!staffId) {
      return res.status(403).json({ message: "Access denied. Staff or Admin only." });
    }

    const { id } = req.params;
    await saunaService.deleteSession(id);
    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting sauna session:", error);
    if (error.message === "Session not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  // Boxing Sessions
  getBoxingSessions,
  createBoxingSession,
  updateBoxingSession,
  cancelBoxingSession,
  deleteBoxingSession,

  // Sauna Sessions
  getSaunaSessions,
  createSaunaSession,
  updateSaunaSession,
  cancelSaunaSession,
  deleteSaunaSession
};