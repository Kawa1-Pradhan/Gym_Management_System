import Milestone from "../models/Milestone.js";
import UserAchievement from "../models/UserAchievement.js";
import User from "../models/User.js";
import PointRule from "../models/PointRule.js";
import PointLog from "../models/PointLog.js";
import notificationService from "../services/notificationService.js";

// -- Admin/Staff milestone management --

export const getMilestones = async (req, res) => {
    try {
        const milestones = await Milestone.find().sort({ pointsRequired: 1 });
        res.json(milestones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createMilestone = async (req, res) => {
    try {
        const milestone = new Milestone(req.body);
        await milestone.save();
        res.status(201).json(milestone);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateMilestone = async (req, res) => {
    try {
        const milestone = await Milestone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!milestone) return res.status(404).json({ message: "Milestone not found" });
        res.json(milestone);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteMilestone = async (req, res) => {
    try {
        const milestone = await Milestone.findByIdAndDelete(req.params.id);
        if (!milestone) return res.status(404).json({ message: "Milestone not found" });

        // Also remove related user achievements
        await UserAchievement.deleteMany({ milestoneId: req.params.id });

        res.json({ message: "Milestone deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// -- Member functions --

export const getMemberAchievements = async (req, res) => {
    try {
        let userId = req.user._id || req.user.id;

        // If staff/admin provides a memberId, use that instead
        if (req.query.memberId && (req.user.role.includes('STAFF') || req.user.role.includes('ADMIN'))) {
            userId = req.query.memberId;
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const totalPoints = user.points || 0;

        // Get all active milestones
        const allMilestones = await Milestone.find({ isActive: true }).sort({ pointsRequired: 1 });

        // Get unlocked achievements and populate milestone
        const unlockedAchievementsQuery = await UserAchievement.find({ userId }).populate("milestoneId");

        const unlockedAchievements = unlockedAchievementsQuery.map(ua => ({
            _id: ua._id,
            unlockedAt: ua.createdAt,
            milestone: ua.milestoneId
        }));

        // Compute current level and next milestone based on active milestones
        let currentLevel = null;
        let nextMilestone = null;

        for (let i = 0; i < allMilestones.length; i++) {
            if (totalPoints >= allMilestones[i].pointsRequired) {
                currentLevel = allMilestones[i];
            } else {
                nextMilestone = allMilestones[i];
                break;
            }
        }

        let progress = null;
        if (nextMilestone) {
            const previousPoints = currentLevel ? currentLevel.pointsRequired : 0;
            const pointsNeeded = nextMilestone.pointsRequired - totalPoints;
            const range = nextMilestone.pointsRequired - previousPoints;
            const percentage = Math.max(0, Math.min(100, ((totalPoints - previousPoints) / range) * 100));
            progress = { pointsNeeded, percentage };
        }

        res.json({
            totalPoints,
            currentLevel,
            nextMilestone,
            progress,
            unlockedAchievements,
            allMilestones
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// -- Point System Rules (Admin Only) --

const seedPointRules = async () => {
    const defaults = [
        { action: 'SIGNUP', points: 100, description: 'Points awarded for joining the gym' },
        { action: 'RENEWAL', points: 50, description: 'Points awarded for membership renewal' },
        { action: 'ATTENDANCE', points: 5, description: 'Points awarded for each attendance session' },
        { action: 'BOOKING', points: 2, description: 'Points awarded for booking a session' }
    ];

    for (const def of defaults) {
        const exists = await PointRule.findOne({ action: def.action });
        if (!exists) {
            await PointRule.create({ ...def, isActive: true });
        }
    }
};

export const getPointRules = async (req, res) => {
    try {
        await seedPointRules(); // Ensure defaults exist
        const rules = await PointRule.find();
        res.json(rules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePointRule = async (req, res) => {
    try {
        const { points, isActive, description } = req.body;
        const rule = await PointRule.findByIdAndUpdate(
            req.params.id,
            { points, isActive, description, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
        if (!rule) return res.status(404).json({ message: "Rule not found" });
        res.json(rule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// -- Point History (Logs) --

export const getPointHistory = async (req, res) => {
    try {
        const { memberId } = req.query;
        let query = {};

        const isAdminOrStaff = req.user.role.includes('STAFF') || req.user.role.includes('ADMIN');

        if (memberId) {
            query.userId = memberId;
        } else if (!isAdminOrStaff) {
            // Regular members only see their own
            query.userId = req.user._id || req.user.id;
        }
        // If Admin/Staff and NO memberId, query remains empty -> fetch ALL logs

        const logs = await PointLog.find(query)
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('userId', 'name email');

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Utility function called by other services when points change ---

export const awardPoints = async (userId, pointsToAdd, reason, source = "MANUAL") => {
    try {
        const user = await User.findById(userId);
        if (!user) return; // Silent fail if user not found

        const oldPoints = user.points || 0;
        user.points = oldPoints + pointsToAdd;
        await user.save();

        // Log the transaction
        await PointLog.create({
            userId,
            points: pointsToAdd,
            reason,
            source: source.toUpperCase()
        });

        const newPoints = user.points;
        const allMilestones = await Milestone.find({ isActive: true }).sort({ pointsRequired: 1 });

        for (const milestone of allMilestones) {
            if (newPoints >= milestone.pointsRequired && oldPoints < milestone.pointsRequired) {
                // Milestone unlocked!
                await UserAchievement.create({
                    userId: user._id,
                    milestoneId: milestone._id
                });

                // Add Notification for user
                await notificationService.upsertNotification(
                    user._id,
                    "New Milestone Unlocked!",
                    `Congratulations! You've unlocked the "${milestone.title}" milestone by reaching ${milestone.pointsRequired} points.`,
                    "achievement",
                    milestone._id,
                    "/dashboard"
                );
            }
        }
    } catch (err) {
        console.error("Error awarding points:", err);
    }
};

export const manualAwardPoints = async (req, res) => {
    try {
        const { memberId, points, reason } = req.body;

        if (!memberId || !String(memberId).trim()) {
            return res.status(400).json({ message: "Member ID is required" });
        }

        if (points === undefined || points === null || points === '') {
            return res.status(400).json({ message: "Points are required" });
        }

        const numPoints = Number(points);
        if (isNaN(numPoints) || numPoints <= 0) {
            return res.status(400).json({ message: "Points must be greater than 0" });
        }

        const member = await User.findById(String(memberId).trim());
        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        await awardPoints(member._id, numPoints, reason || "Manually awarded by Admin", "MANUAL");

        return res.json({ message: `${numPoints} points awarded successfully to ${member.name}` });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const deletePointLog = async (req, res) => {
    try {
        const { id } = req.params;
        const log = await PointLog.findById(id);

        if (!log) {
            return res.status(404).json({ message: "Log not found" });
        }

        // Allow only the owner or an admin/staff to delete
        const isStaffOrAdmin = req.user.role.includes('STAFF') || req.user.role.includes('ADMIN');
        if (log.userId.toString() !== req.user.id.toString() && !isStaffOrAdmin) {
            return res.status(403).json({ message: "Not authorized to delete this log" });
        }

        await PointLog.findByIdAndDelete(id);
        res.json({ message: "Point history log deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
