import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, "Discount code is required"],
    unique: true,
    uppercase: true,
  },
  description: {
    type: String,
  },
  percentage: {
    type: Number,
    required: [true, "Discount percentage is required"],
    min: [0, "Percentage cannot be less than 0"],
    max: [100, "Percentage cannot be more than 100"],
  },
  startDate: {
    type: Date,
    required: [true, "Discount start date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "Discount end date is required"],
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Admin creating discount is required"],
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
discountSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Discount = mongoose.model("discounts", discountSchema);

export default Discount;
