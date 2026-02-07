import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    durationDays: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    features: {
        type: [String],
        default: []
    },
    highlightTag: {
        type: String, // e.g., "Best Value", "Popular"
        default: ""
    },
    discountPercent: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const MembershipPlan = mongoose.model("MembershipPlan", membershipPlanSchema);
export default MembershipPlan;
