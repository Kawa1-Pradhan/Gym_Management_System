import express from "express";
import { getPlans, initiatePurchase, verifyPayment, getUserPayments, updatePlan } from "../controllers/membershipController.js";
import { optionalAuth, requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/plans", getPlans);

// Initiate purchase can be public (guest) or protected (member).
// optionalAuth will populate req.user if token exists.
router.post("/purchase", optionalAuth, initiatePurchase);

router.post("/verify", verifyPayment);

router.post("/verify", verifyPayment);

// Protected routes (Admin only for updates)
import { requireAdmin } from "../middlewares/authMiddleware.js";
router.patch("/plans/:id", requireAuth, requireAdmin, updatePlan);

// Private routes
router.get("/my-payments", requireAuth, getUserPayments);

export default router;
