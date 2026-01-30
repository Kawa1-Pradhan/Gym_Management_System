import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, "Inventory item name is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0, "Quantity cannot be negative"],
    default: 0,
  },
  lowStockThreshold: {
    type: Number,
    required: [true, "Low stock threshold is required"],
    min: [0, "Threshold cannot be negative"],
    default: 5,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Staff/Admin who updated inventory is required"],
  },
  status: {
    type: String,
    enum: ["Available", "Low", "OutOfStock"],
    default: "Available",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Automatically update updatedAt on save
inventorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  // Update status based on quantity and lowStockThreshold
  if (this.quantity === 0) this.status = "OutOfStock";
  else if (this.quantity <= this.lowStockThreshold) this.status = "Low";
  else this.status = "Available";
  next();
});

const Inventory = mongoose.model("inventories", inventorySchema);

export default Inventory;
