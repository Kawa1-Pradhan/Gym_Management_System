import mongoose from "mongoose";

const pointLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true
    },
    points: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    source: {
        type: String,
        enum: ["ATTENDANCE", "RENEWAL", "MANUAL", "SIGNUP", "BOOKING"],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

const PointLog = mongoose.model("point_logs", pointLogSchema);

export default PointLog;
