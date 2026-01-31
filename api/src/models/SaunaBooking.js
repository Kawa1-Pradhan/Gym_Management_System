import mongoose from "mongoose";

const saunaBookingSchema = new mongoose.Schema({
  // Reference to the Member (User with MEMBER role) making the booking
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: [true, "Sauna booking must be linked to a member"],
    validate: {
      validator: async function(value) {
        const user = await mongoose.model('users').findById(value);
        return user && user.role.includes('MEMBER');
      },
      message: "Member must have MEMBER role"
    }
  },

  // Reference to the actual SaunaSession being booked
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "saunaSessions",
    required: [true, "Sauna booking must reference a valid session"],
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
saunaBookingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
saunaBookingSchema.index({ memberId: 1, sessionId: 1 });
saunaBookingSchema.index({ sessionId: 1, status: 1 });

// Virtual for populating session details
saunaBookingSchema.virtual('sessionDetails', {
  ref: 'saunaSessions',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true
});

// Virtual for populating member details
saunaBookingSchema.virtual('memberDetails', {
  ref: 'users',
  localField: 'memberId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
saunaBookingSchema.set('toJSON', { virtuals: true });
saunaBookingSchema.set('toObject', { virtuals: true });

const SaunaBooking = mongoose.model("saunaBookings", saunaBookingSchema);

export default SaunaBooking;
