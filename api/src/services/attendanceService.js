import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

const markAttendance = async (memberId, markedBy) => {
    // 1. Check if member exists and is active
    const member = await User.findById(memberId);
    if (!member) {
        throw { statusCode: 404, message: "Member not found" };
    }

    if (member.membershipStatus !== "Active") {
        throw { statusCode: 400, message: "Membership is not active" };
    }

    // 2. Check if membership is expired
    if (member.membershipExpiryDate && new Date(member.membershipExpiryDate) < new Date()) {
        throw { statusCode: 400, message: "Membership has expired. Cannot mark attendance." };
    }

    // 3. Prevent self-attendance (Staff cannot mark themselves as member)
    if (memberId.toString() === markedBy.toString()) {
        throw { statusCode: 400, message: "Staff cannot mark their own attendance" };
    }

    const todayStart = new Date().setHours(0, 0, 0, 0);

    // 4. Check for duplicate attendance
    const existing = await Attendance.findOne({
        member: memberId,
        date: todayStart
    });

    if (existing) {
        throw { statusCode: 400, message: "Attendance already marked for today" };
    }

    const attendance = await Attendance.create({
        member: memberId,
        markedBy: markedBy,
        date: todayStart
    });

    // Award points for attendance using rules
    const { awardPoints } = await import("../controllers/achievementController.js");
    const PointRule = (await import("../models/PointRule.js")).default;

    const attendanceRule = await PointRule.findOne({ action: 'ATTENDANCE', isActive: true });
    if (attendanceRule) {
        await awardPoints(memberId, attendanceRule.points, "Gym Session Attendance", "ATTENDANCE");
    } else {
        // Fallback or skip if no rule defined
        await awardPoints(memberId, 10, "Attendance Marked", "ATTENDANCE");
    }

    return await Attendance.findById(attendance._id)
        .populate('member', 'name email phone')
        .populate('markedBy', 'name');
};

const getMemberAttendance = async (memberId) => {
    return await Attendance.find({ member: memberId })
        .sort({ date: -1 })
        .populate('markedBy', 'name');
};

const getAllAttendance = async (filters = {}) => {
    const query = {};
    if (filters.date) {
        const queryDate = new Date(filters.date).setHours(0, 0, 0, 0);
        query.date = queryDate;
    }
    if (filters.memberId) {
        query.member = filters.memberId;
    }

    return await Attendance.find(query)
        .sort({ date: -1 })
        .populate('member', 'name email phone')
        .populate('markedBy', 'name');
};

export default {
    markAttendance,
    getMemberAttendance,
    getAllAttendance
};
