import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Announcement title is required"],
  },
  message: {
    type: String,
    required: [true, "Announcement message is required"],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Admin creating announcement is required"],
  },
  targetRoles: {
    type: [String],
    enum: ["MEMBER", "STAFF", "ADMIN"],
    default: ["MEMBER", "STAFF", "ADMIN"],
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
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
announcementSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Announcement = mongoose.model("announcements", announcementSchema);

export default Announcement;
