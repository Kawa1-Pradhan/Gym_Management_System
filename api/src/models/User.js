import mongoose from "mongoose";

const users = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter a name"]
  },
  email: {
    type: String,
    required: [true, "Please enter an email"],
    trim: true,
    lowercase: true,
    unique: true,
    validate: {
      validator: (value) => {
        // Updated regex to support + alias addresses common in Gmail and testing
        const emailRegex = /^((?!\.)[\w\-_.+]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;
        return emailRegex.test(value);
      },
      message: "Invalid email address",
    },

  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  role: {
    type: [String],
    enum: ["MEMBER", "ADMIN", "STAFF"],
    default: ["MEMBER"],
  },
  profileImageUrls: {
    type: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutables: true,
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    unique: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  mustChangePassword: {
    type: Boolean,
    default: false,
  },
  emailLastStatus: {
    type: String,
    enum: ["Pending", "Sent", "Failed", "N/A"],
    default: "N/A",
  },
  membershipStatus: {
    type: String,
    enum: ["Active", "Expired", "Pending"],
    default: "Pending",
  },
  membershipExpiryDate: {
    type: Date,
  },
  membershipType: {
    type: String, // e.g. "Monthly", "Yearly" - derived from Plan Name
    default: "None"
  },
  membershipStartDate: {
    type: Date
  },
  emailLastError: {
    type: String,
  },
  remindersSent: {
    type: [String], // tracks membership reminders: '7d', '1d', 'expired'
    default: [],
  },
  notes: {
    type: String,
  },
});

const User = mongoose.model("users", users);

export default User;