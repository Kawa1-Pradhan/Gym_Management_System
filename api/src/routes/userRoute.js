import express from "express";
import userController from "../controllers/userController.js";
import { requireAuth, requireStaffOrAdmin } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post("/", requireAuth, requireStaffOrAdmin, userController.createUser);

router.get("/", requireAuth, requireStaffOrAdmin, userController.getUsers);

router.get("/:id", requireAuth, userController.getUserById);

router.put("/:id", requireAuth, requireStaffOrAdmin, userController.updateUser);

router.patch("/:id/deactivate", requireAuth, requireStaffOrAdmin, userController.deactivateUser);

router.post("/:id/reset-password", requireAuth, requireStaffOrAdmin, userController.resetPassword);

router.post("/:id/resend", requireAuth, requireStaffOrAdmin, userController.resendCredentials);

router.post("/change-password", requireAuth, userController.changePassword);

router.delete("/:id", requireAuth, requireStaffOrAdmin, userController.deleteUser);

export default router;