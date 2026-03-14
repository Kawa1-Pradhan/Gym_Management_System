import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    pointsRequired: {
        type: Number,
        required: true
    },
    rewardDescription: {
        type: String,
        default: ""
    },
    icon: {
        type: String, // E.g., emoji or path
        default: "🏆"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Milestone = mongoose.model("Milestone", milestoneSchema);
export default Milestone;
