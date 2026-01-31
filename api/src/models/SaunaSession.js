import mongoose from "mongoose";

const saunaSessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Session name is required"],
  },
  date: {
    type: Date,
    required: [true, "Session date is required"],
  },
  startTime: {
    type: String,
    required: [true, "Start time is required"],
  },
  endTime: {
    type: String,
    required: [true, "End time is required"],
  },
  maxCapacity: {
    type: Number,
    required: [true, "Max capacity is required"],
    min: 1,
  },
  availableSlots: {
    type: Number,
    required: true,
    min: 0,
  },
  temperature: {
    type: Number,
    default: 85, // Default temperature in Celsius
    min: 60,
    max: 100,
  },
  status: {
    type: String,
    enum: ["Active", "Cancelled", "Completed"],
    default: "Active",
  },
  description: {
    type: String,
    default: "",
  },
  // Reference to the Staff member (User with STAFF or ADMIN role) who created the session
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Session must be created by staff or admin"],
  },
  // Array of members who have booked this session
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  }],
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
saunaSessionSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// Index for efficient queries
saunaSessionSchema.index({ date: 1, startTime: 1 });

const SaunaSession = mongoose.model("saunaSessions", saunaSessionSchema);

export default SaunaSession;