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
        const emailRegex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;
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
  membershipStatus: {
    type: String,
    enum: ["Active", "Expired", "Pending"],
    default: "Pending",
  },
  membershipExpiryDate: {
    type: Date,
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
  emailLastError: {
    type: String,
  },
  membershipType: {
    type: String,
    enum: ["Monthly", "Quarterly", "Semi-Annual", "Yearly", "None"],
    default: "None",
  },
  membershipStartDate: {
    type: Date,
  },
  notes: {
    type: String,
  },
});

const User = mongoose.model("users", users);

export default User;