import Inventory from "../models/Inventory.js";

/**
 * Get all inventory items
 * Admin can see all, Staff can see all (per requirements dashboard view)
 * but removal/update permission is checked in controller.
 */
const getAllInventoryItems = async () => {
    return await Inventory.find({})
        .populate("createdBy", "name email")
        .populate("lastUpdatedBy", "name email")
        .sort({ updatedAt: -1 });
};

/**
 * Create a new inventory item
 */
const createInventoryItem = async (data, userId) => {
    const item = new Inventory({
        ...data,
        createdBy: userId,
        lastUpdatedBy: userId
    });
    const savedItem = await item.save();
    return await savedItem.populate("createdBy", "name email");
};

/**
 * Update an inventory item
 */
const updateInventoryItem = async (id, data, userId) => {
    const item = await Inventory.findById(id);
    if (!item) {
        throw new Error("Inventory item not found");
    }

    // Update fields
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            item[key] = data[key];
        }
    });

    item.lastUpdatedBy = userId;

    await item.save();

    return await Inventory.findById(id)
        .populate("createdBy", "name email")
        .populate("lastUpdatedBy", "name email");
};

/**
 * Delete an inventory item
 */
const deleteInventoryItem = async (id) => {
    const item = await Inventory.findByIdAndDelete(id);
    if (!item) {
        throw new Error("Inventory item not found");
    }
    return item;
};

/**
 * Get inventory reports (Admin only)
 */
const getInventoryReports = async () => {
    const totalItems = await Inventory.countDocuments();
    const lowStockItems = await Inventory.countDocuments({ status: "Low" });
    const outOfStockItems = await Inventory.countDocuments({ status: "OutOfStock" });

    const categoryBreakdown = await Inventory.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 }, totalValue: { $sum: { $multiply: ["$price", "$quantity"] } } } }
    ]);

    return {
        totalItems,
        lowStockItems,
        outOfStockItems,
        categoryBreakdown
    };
};

export default {
    getAllInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getInventoryReports
};
