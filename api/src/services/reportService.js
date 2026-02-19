import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import BoxingSession from "../models/BoxingSession.js";
import SaunaSession from "../models/SaunaSession.js";
import mongoose from "mongoose";

/**
 * DAILY ATTENDANCE REPORT
 * Show all members who attended on a specific day.
 */
const getDailyAttendance = async (dateStr) => {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({ date: targetDate })
        .populate("member", "name membershipType status")
        .sort({ createdAt: -1 });

    // Multi-member ID list to fetch cumulative counts
    const memberIds = attendance.map(a => a.member?._id).filter(id => id);

    // Fetch cumulative counts for these members
    const cumulativeCounts = await Attendance.aggregate([
        { $match: { member: { $in: memberIds } } },
        { $group: { _id: "$member", total: { $sum: 1 } } }
    ]);

    const countMap = {};
    cumulativeCounts.forEach(c => {
        countMap[c._id.toString()] = c.total;
    });

    return attendance.map(record => ({
        date: record.date,
        memberName: record.member?.name || "Unknown",
        membershipType: record.member?.membershipType || "None",
        memberStatus: record.member?.status || "Inactive",
        status: record.status,
        checkInTime: record.createdAt,
        totalPresenceCount: countMap[record.member?._id?.toString()] || 1
    }));
};

/**
 * MONTHLY ATTENDANCE REPORT
 * Summary of attendance for each member per month.
 */
const getMonthlyAttendance = async (month, year) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(year, month, 0).getDate();

    const attendanceAggregation = await Attendance.aggregate([
        {
            $match: {
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: "$member",
                daysAttended: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "memberInfo"
            }
        },
        {
            $unwind: "$memberInfo"
        },
        {
            $project: {
                _id: 0,
                memberId: "$_id",
                name: "$memberInfo.name",
                email: "$memberInfo.email",
                daysAttended: 1,
                missedDays: { $subtract: [daysInMonth, "$daysAttended"] },
                attendancePercentage: {
                    $multiply: [
                        { $divide: ["$daysAttended", daysInMonth] },
                        100
                    ]
                }
            }
        },
        { $sort: { daysAttended: -1 } }
    ]);

    return attendanceAggregation;
};

/**
 * SESSION REPORTS
 * Show bookings per day/week and compare booked vs completed.
 */
const getSessionReports = async (startDateStr, endDateStr) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const now = new Date();

    // Fetch all bookings in period with populated session and member info
    const bookings = await Booking.find({
        createdAt: { $gte: startDate, $lte: endDate }
    })
        .populate("memberId", "name")
        .sort({ createdAt: -1 });

    const sessionIds = [...new Set(bookings.map(b => b.sessionId))];

    // Fetch all relevant sessions
    const [boxingSessions, saunaSessions] = await Promise.all([
        BoxingSession.find({ _id: { $in: sessionIds } }).select('name date startTime endTime status maxCapacity'),
        SaunaSession.find({ _id: { $in: sessionIds } }).select('name date startTime endTime status maxCapacity')
    ]);

    const sessionMap = {};
    boxingSessions.forEach(s => { sessionMap[s._id.toString()] = { ...s._doc, type: 'Boxing' }; });
    saunaSessions.forEach(s => { sessionMap[s._id.toString()] = { ...s._doc, type: 'Sauna' }; });

    const detailedBookings = bookings.map(b => {
        const session = sessionMap[b.sessionId.toString()];
        const sessionDate = session ? new Date(session.date) : null;

        // Determine status based on session time or session status
        let status = "Unknown";
        if (session) {
            if (session.status === "Cancelled") {
                status = "Cancelled";
            } else if (session.status === "Completed" || (sessionDate && sessionDate < now)) {
                status = "Completed";
            } else {
                status = "Upcoming";
            }
        }

        return {
            id: b._id,
            memberName: b.memberId?.name || "Unknown",
            sessionName: session?.name || "Unknown Session",
            sessionType: b.sessionType,
            date: session?.date,
            time: session ? `${session.startTime} - ${session.endTime}` : "N/A",
            status: status
        };
    });

    // Summary stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const summary = {
        totalToday: detailedBookings.filter(b => {
            const d = new Date(b.date);
            return b.date && d >= today && d < tomorrow;
        }).length,
        upcoming: detailedBookings.filter(b => b.status === 'Upcoming').length,
        completed: detailedBookings.filter(b => b.status === 'Completed').length
    };

    const detailedSessions = [...boxingSessions, ...saunaSessions].map(s => {
        const sDate = s.date ? new Date(s.date).getTime() : null;
        const bookingsInSession = detailedBookings.filter(b => {
            if (!b.date || !sDate) return false;
            try {
                return b.sessionName === s.name && new Date(b.date).getTime() === sDate;
            } catch (e) {
                return false;
            }
        });
        return {
            id: s._id,
            name: s.name,
            type: sessionMap[s._id.toString()]?.type,
            date: s.date,
            time: `${s.startTime} - ${s.endTime}`,
            maxCapacity: s.maxCapacity || 0,
            bookedCount: bookingsInSession.length,
            status: s.status
        };
    });

    return {
        bookings: detailedBookings,
        sessions: detailedSessions,
        summary: summary
    };
};

/**
 * REVENUE REPORTS
 * Show total revenue collected per plan/package and renewal stats.
 */
const getRevenueReports = async (startDateStr, endDateStr) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    // Fetch all successful payments in period with member info
    const payments = await Payment.find({
        status: "Completed",
        createdAt: { $gte: startDate, $lte: endDate }
    })
        .populate("userId", "name")
        .sort({ createdAt: -1 });

    const revenueAggregation = await Payment.aggregate([
        {
            $match: {
                status: "Completed",
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: { plan: { $ifNull: ["$purchaseOrderName", "$categoryName"] }, category: "$categoryName" },
                totalRevenue: { $sum: "$amount" },
                count: { $sum: 1 },
                newMembers: {
                    $sum: { $cond: [{ $eq: ["$type", "New"] }, 1, 0] }
                },
                renewals: {
                    $sum: { $cond: [{ $eq: ["$type", "Renewal"] }, 1, 0] }
                }
            }
        },
        { $sort: { totalRevenue: -1 } }
    ]);

    const details = revenueAggregation.map(plan => ({
        ...plan,
        totalRevenue: plan.totalRevenue / 100,
        planName: plan._id.plan
    }));

    const transactionLogs = payments.map(p => ({
        id: p._id,
        memberName: p.userId?.name || "Unknown",
        planName: p.purchaseOrderName || p.categoryName,
        category: p.categoryName,
        amount: p.amount / 100,
        type: p.type, // New/Renewal
        date: p.createdAt
    }));

    const totalRevenue = transactionLogs.reduce((acc, curr) => acc + curr.amount, 0);
    const totalNew = transactionLogs.filter(t => t.type === 'New').length;
    const totalRenewals = transactionLogs.filter(t => t.type === 'Renewal').length;

    const summary = {
        totalNewMemberships: totalNew,
        totalRenewals: totalRenewals,
        totalRevenue: totalRevenue,
        planRenewals: details.map(d => ({ planName: d.planName, count: d.renewals }))
    };

    return { details, summary, transactionLogs };
};

/**
 * TOP MEMBERS
 * Identify members with highest attendance.
 */
const getTopMembers = async (limit = 10) => {
    const topMembers = await Attendance.aggregate([
        {
            $group: {
                _id: "$member",
                attendanceCount: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "memberInfo"
            }
        },
        { $unwind: "$memberInfo" },
        {
            $project: {
                _id: 0,
                memberId: "$_id",
                name: "$memberInfo.name",
                email: "$memberInfo.email",
                attendanceCount: 1,
                membershipType: "$memberInfo.membershipType"
            }
        },
        { $sort: { attendanceCount: -1 } },
        { $limit: limit }
    ]);

    return topMembers;
};

/**
 * PUBLIC ANALYTICS
 * Fetch live stats for the landing page with daily-weighted attendance logic.
 */
const getPublicAnalytics = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfMonth = now.getDate(); // e.g., 19 if today is Feb 19

    const [
        totalMembers,
        membershipsSold,
        monthlyBookings,
        actualAttendancesThisMonth,
        popularSessions
    ] = await Promise.all([
        // 1. Total Members
        User.countDocuments({ role: "MEMBER" }),
        // 2. Memberships Sold (Historical)
        Payment.countDocuments({ status: "Completed" }),
        // 3. Total Completed Bookings This Month (Historical activity)
        Booking.countDocuments({
            status: "Completed",
            bookingDate: { $gte: startOfMonth }
        }),
        // 4. Total actual attendances of all members this month (Staff-marked)
        Attendance.countDocuments({
            date: { $gte: startOfMonth }
        }),
        // 5. Popular Classes (Top 1)
        Booking.aggregate([
            { $group: { _id: "$sessionType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ])
    ]);

    // Daily Weighted Attendance Logic:
    // Eligibility = Total Members * Days Elapsed This Month
    // This assumes 1 attendance opportunity per member per day.
    const totalOpportunities = totalMembers * dayOfMonth;

    // Monthly Attendance % = (Total actual attendances ÷ Total opportunities) * 100
    const attendanceRate = totalOpportunities > 0
        ? Math.round((actualAttendancesThisMonth / totalOpportunities) * 100)
        : (actualAttendancesThisMonth > 0 ? 100 : 0);

    return {
        totalMembers,
        membershipsSold,
        monthlyBookings,
        popularSession: popularSessions[0] ? { type: popularSessions[0]._id, count: popularSessions[0].count } : null,
        attendanceRate
    };
};

export default {
    getDailyAttendance,
    getMonthlyAttendance,
    getSessionReports,
    getRevenueReports,
    getTopMembers,
    getPublicAnalytics
};
