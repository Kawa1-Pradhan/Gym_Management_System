import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Attendance must be linked to a member"],
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Attendance must be recorded by a staff member"],
  },
  checkInTime: {
    type: Date,
    required: [true, "Check-in time is required"],
    default: Date.now,
  },
  checkOutTime: {
    type: Date,
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
attendanceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Attendance = mongoose.model("attendances", attendanceSchema);

export default Attendance;
