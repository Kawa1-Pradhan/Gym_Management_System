import express from "express";
import {
    getMilestones, createMilestone, updateMilestone, deleteMilestone,
    getMemberAchievements, manualAwardPoints,
    getPointRules, updatePointRule, getPointHistory
} from "../controllers/achievementController.js";
import { requireAuth, requireStaffOrAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Point System (Rules & History)
router.get("/rules", requireAuth, getPointRules);
router.put("/rules/:id", requireAuth, requireStaffOrAdmin, updatePointRule);
router.get("/history", requireAuth, getPointHistory);
router.delete("/history/:id", requireAuth, (await import("../controllers/achievementController.js")).deletePointLog);

// Admin / Staff Routes
router.get("/milestones", requireAuth, getMilestones);
router.post("/milestones", requireAuth, requireStaffOrAdmin, createMilestone);
router.put("/milestones/:id", requireAuth, requireStaffOrAdmin, updateMilestone);
router.delete("/milestones/:id", requireAuth, requireStaffOrAdmin, deleteMilestone);
router.post("/award-points", requireAuth, requireStaffOrAdmin, manualAwardPoints);

// Member Routes
router.get("/my-progress", requireAuth, getMemberAchievements);

export default router;
