import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Attendance must be linked to a member"],
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Attendance must be recorded by a staff member"],
  },
  date: {
    type: Date,
    required: [true, "Date is required"],
    default: () => new Date().setHours(0, 0, 0, 0), // Use start of day for easier comparison
  },
  status: {
    type: String,
    enum: ["Present"],
    default: "Present",
  }
}, {
  timestamps: true
});

// Avoid duplicate attendance for same member on same day
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
