import mongoose from "mongoose";

// Tracks unlocked milestones per user
const userAchievementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    milestoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Milestone",
        required: true
    },
    unlockedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const UserAchievement = mongoose.model("UserAchievement", userAchievementSchema);
export default UserAchievement;
