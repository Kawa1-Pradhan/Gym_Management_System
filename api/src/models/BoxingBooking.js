import mongoose from "mongoose";

const boxingBookingSchema = new mongoose.Schema({
  // Reference to the Member (User with MEMBER role) making the booking
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Boxing booking must be linked to a member"],
    validate: {
      validator: async function(value) {
        const user = await mongoose.model('users').findById(value);
        return user && user.role.includes('MEMBER');
      },
      message: "Member must have MEMBER role"
    }
  },

  // Reference to the actual BoxingSession being booked
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "boxingSessions",
    required: [true, "Boxing booking must reference a valid session"],
  },

  // Booking status - independent of session status
  status: {
    type: String,
    enum: ["Confirmed", "Cancelled", "Completed", "Pending"],
    default: "Pending",
  },

  // Additional booking-specific fields
  specialRequests: {
    type: String,
    default: "",
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Booking confirmation timestamp
  confirmedAt: {
    type: Date,
  },
});

// Automatically update updatedAt on save
boxingBookingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
boxingBookingSchema.index({ memberId: 1, sessionId: 1 });
boxingBookingSchema.index({ sessionId: 1, status: 1 });

// Virtual for populating session details
boxingBookingSchema.virtual('sessionDetails', {
  ref: 'boxingSessions',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true
});

// Virtual for populating member details
boxingBookingSchema.virtual('memberDetails', {
  ref: 'users',
  localField: 'memberId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
boxingBookingSchema.set('toJSON', { virtuals: true });
boxingBookingSchema.set('toObject', { virtuals: true });

const BoxingBooking = mongoose.model("boxingBookings", boxingBookingSchema);

export default BoxingBooking;
