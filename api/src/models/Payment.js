import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Payment must be linked to a member"],
  },
  membershipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "memberships",
    required: [true, "Payment must be linked to a membership"],
  },
  amount: {
    type: Number,
    required: [true, "Payment amount is required"],
    min: [0, "Amount cannot be negative"],
  },
  paymentMethod: {
    type: String,
    enum: ["Online", "Offline"],
    required: [true, "Payment method is required"],
  },
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  paymentDate: {
    type: Date,
    default: Date.now,
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
paymentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Payment = mongoose.model("payments", paymentSchema);

export default Payment;
