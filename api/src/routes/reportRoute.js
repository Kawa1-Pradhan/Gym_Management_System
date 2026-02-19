import express from "express";
import reportController from "../controllers/reportController.js";
import { requireAuth, requireStaffOrAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All reporting routes require Staff or Admin role
router.use(requireAuth, requireStaffOrAdmin);

router.get("/attendance/daily", reportController.getDailyAttendance);
router.get("/attendance/monthly", reportController.getMonthlyAttendance);
router.get("/sessions", reportController.getSessionReport);
router.get("/revenue", reportController.getRevenueReport);
router.get("/top-members", reportController.getTopMembersReport);

export default router;
