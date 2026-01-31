import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "Member ID is required"],
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Session ID is required"],
    },
    sessionType: {
        type: String,
        enum: ["Boxing", "Sauna"],
        required: [true, "Session type is required"],
    },
    bookingDate: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
    status: {
        type: String,
        enum: ["Booked", "Cancelled"],
        default: "Booked",
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

// Compound index to prevent duplicate bookings
bookingSchema.index({ memberId: 1, sessionId: 1, sessionType: 1 }, { unique: true });

// Index for quick member booking lookups
bookingSchema.index({ memberId: 1 });

// Index for session booking lookups
bookingSchema.index({ sessionId: 1, sessionType: 1 });

// Automatically update updatedAt on save
bookingSchema.pre("save", function () {
    this.updatedAt = Date.now();
});

const Booking = mongoose.model("bookings", bookingSchema);

export default Booking;
