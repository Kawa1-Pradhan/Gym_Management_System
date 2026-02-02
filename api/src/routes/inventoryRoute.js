import express from "express";
import inventoryController from "../controllers/inventoryController.js";
import { requireAuth, requireStaffOrAdmin, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All inventory routes require Auth
router.use(requireAuth);

router.get("/", requireStaffOrAdmin, inventoryController.getInventory);
router.post("/", requireAdmin, inventoryController.addItem);
router.put("/:id", requireStaffOrAdmin, inventoryController.updateItem);
router.patch("/:id/reduce", requireStaffOrAdmin, inventoryController.reduceStock);
router.delete("/:id", requireAdmin, inventoryController.deleteItem);
router.get("/reports", requireAdmin, inventoryController.getReports);

export default router;
