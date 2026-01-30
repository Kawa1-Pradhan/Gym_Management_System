import mongoose from "mongoose";

const saunaBookingSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Sauna booking must be linked to a member"],
  },
  saunaSlot: {
    type: String,
    required: [true, "Please select a sauna slot"],
  },
  bookingDate: {
    type: Date,
    required: [true, "Booking date is required"],
  },
  status: {
    type: String,
    enum: ["Confirmed", "Cancelled", "Pending"],
    default: "Pending",
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
saunaBookingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const SaunaBooking = mongoose.model("saunaBookings", saunaBookingSchema);

export default SaunaBooking;
