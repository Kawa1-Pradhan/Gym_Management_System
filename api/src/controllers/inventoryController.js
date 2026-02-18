import inventoryService from "../services/inventoryService.js";
import Inventory from "../models/Inventory.js";

const getInventory = async (req, res) => {
    try {
        const items = await inventoryService.getAllInventoryItems();
        res.json(items);
    } catch (error) {
        console.error("❌ Error fetching inventory:", error);
        res.status(500).json({ message: "Server error", error: error.message, stack: error.stack });
    }
};

const addItem = async (req, res) => {
    console.log("📦 Incoming inventory add request:", req.body);
    try {
        const { name, category, quantity } = req.body;

        // Basic validation before service call
        if (!name || quantity === undefined) {
            return res.status(400).json({
                message: "Missing required fields. 'name' and 'quantity' are required."
            });
        }

        if (quantity < 0) {
            return res.status(400).json({ message: "Quantity cannot be negative." });
        }

        const item = await inventoryService.createInventoryItem(req.body, req.user.id);
        console.log("✅ Item created successfully:", item.name);
        res.status(201).json(item);
    } catch (error) {
        console.error("❌ Error adding inventory item:", error);

        // Handle Mongoose validation errors specifically
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Validation Error",
                details: Object.values(error.errors).map(e => e.message)
            });
        }

        res.status(500).json({
            message: "Failed to add inventory item",
            error: error.message
        });
    }
};

const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Inventory.findById(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        const updatedItem = await inventoryService.updateInventoryItem(id, req.body, req.user.id);
        res.json(updatedItem);
    } catch (error) {
        console.error("Error updating inventory item:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Inventory.findById(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        await inventoryService.deleteInventoryItem(id);
        res.json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error("Error deleting inventory item:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const reduceStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body; // Amount to reduce by

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Valid amount is required" });
        }

        const item = await Inventory.findById(id);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (item.quantity < amount) {
            return res.status(400).json({ message: "Insufficient stock" });
        }

        const updatedItem = await inventoryService.updateInventoryItem(id, {
            quantity: item.quantity - amount
        }, req.user.id);

        // Real-time Low Stock Notification
        if (updatedItem.quantity <= updatedItem.lowStockThreshold) {
            const urgency = updatedItem.quantity <= 0 ? "OUT OF STOCK" : "Low Stock";
            const User = (await import('../models/User.js')).default;
            const notificationService = (await import('../services/notificationService.js')).default;

            const staffAndAdmins = await User.find({ role: { $in: ['STAFF', 'ADMIN'] } });
            for (const staff of staffAndAdmins) {
                await notificationService.upsertNotification(
                    staff._id,
                    `Inventory Alert: ${urgency}`,
                    `${updatedItem.name} is now ${urgency.toLowerCase()} (${updatedItem.quantity} left).`,
                    "inventory",
                    updatedItem._id,
                    "/inventory"
                );
            }
        }

        res.json(updatedItem);
    } catch (error) {
        console.error("Error reducing stock:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getReports = async (req, res) => {
    try {
        // This is only for Admin
        if (!req.user.role.includes("ADMIN")) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const reports = await inventoryService.getInventoryReports();
        res.json(reports);
    } catch (error) {
        console.error("Error fetching inventory reports:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export default {
    getInventory,
    addItem,
    updateItem,
    deleteItem,
    reduceStock,
    getReports
};
