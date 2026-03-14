import mongoose from "mongoose";

const pointRuleSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        unique: true,
        enum: ["ATTENDANCE", "RENEWAL", "MANUAL", "SIGNUP", "BOOKING"]
    },
    points: {
        type: Number,
        required: true,
        default: 0
    },
    description: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const PointRule = mongoose.model("point_rules", pointRuleSchema);

export default PointRule;
