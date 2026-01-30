import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Membership must be linked to a user"],
  },
  planName: {
    type: String,
    required: [true, "Please enter a membership plan name"],
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"],
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"],
  },
  status: {
    type: String,
    enum: ["Active", "Expired", "Pending"],
    default: "Pending",
  },
  discountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "discounts",
    default: null,
  },
  price: {
    type: Number,
    required: [true, "Membership price is required"],
    min: [0, "Price cannot be negative"],
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
membershipSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Membership = mongoose.model("memberships", membershipSchema);

export default Membership;
