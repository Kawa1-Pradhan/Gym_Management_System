import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    durationMonths: {
        type: Number,
        required: true
    },
    categories: [{
        name: {
            type: String, // Gym only, Zumba, Cardio only, Gym & Cardio
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    description: {
        type: String,
        required: true
    },
    features: {
        type: [String],
        default: []
    },
    highlightTag: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const MembershipPlan = mongoose.model("MembershipPlan", membershipPlanSchema);
export default MembershipPlan;
