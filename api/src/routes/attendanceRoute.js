import express from "express";
import attendanceController from "../controllers/attendanceController.js";
import { requireAuth, requireStaffOrAdmin, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Members view their own
router.get("/my", requireAuth, attendanceController.getMyAttendance);

// Staff marks attendance
router.post("/mark", requireAuth, requireStaffOrAdmin, attendanceController.markAttendance);

// Staff & Admin view reports
router.get("/reports", requireAuth, requireStaffOrAdmin, attendanceController.getAttendanceReports);

export default router;
