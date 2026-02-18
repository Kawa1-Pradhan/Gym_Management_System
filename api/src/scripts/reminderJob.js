import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Attendance from '../models/Attendance.js';
import Inventory from '../models/Inventory.js';
import BoxingSession from '../models/BoxingSession.js';
import SaunaSession from '../models/SaunaSession.js';
import boxingService from '../services/boxingService.js';
import saunaService from '../services/saunaService.js';
import notificationService from '../services/notificationService.js';
import { toNPT } from '../utils/dateUtils.js';

const runReminderJobs = async () => {
    console.log('🔔 Running background reminder jobs...');
    try {
        await checkMembershipExpiry();
        await checkSessionReminders();
        await checkInventoryLevels();
        await checkBookingStatus();
        await cleanupOldBookings();
    } catch (error) {
        console.error('❌ Error in reminder jobs:', error);
    }
};

const checkMembershipExpiry = async () => {
    const today = toNPT(new Date());
    today.setHours(0, 0, 0, 0);

    // Helper for membership reminders
    const notifyExpiry = async (days, label) => {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + days);

        const users = await User.find({
            role: 'MEMBER',
            membershipExpiryDate: {
                $gte: targetDate,
                $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        for (const user of users) {
            await notificationService.upsertNotification(
                user._id,
                `Membership Expiring in ${label}`,
                `Your membership will expire in ${label}. Please renew to avoid service interruption.`,
                "membership",
                user._id,
                "/profile"
            );
        }
    };

    await notifyExpiry(7, "7 days");
    await notifyExpiry(1, "1 day");

    // Expired today
    const expiredUsers = await User.find({
        role: 'MEMBER',
        membershipExpiryDate: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
    });

    for (const user of expiredUsers) {
        await notificationService.upsertNotification(
            user._id,
            "Membership Expired",
            "Your membership has expired. Please renew to continue using the gym services.",
            "membership",
            user._id,
            "/profile"
        );
    }
};

const checkSessionReminders = async () => {
    const now = toNPT(new Date());
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 1. Member Reminders
    const bookings = await Booking.find({ status: 'Booked' }).populate('memberId');

    for (const booking of bookings) {
        let session;
        if (booking.sessionType === 'Boxing') {
            session = await BoxingSession.findById(booking.sessionId);
        } else {
            session = await SaunaSession.findById(booking.sessionId);
        }

        if (!session || !session.date || session.status !== 'Active') continue;

        const [sHours, sMinutes] = session.startTime.split(':');
        const sessionDate = new Date(session.date);
        const sessionStart = new Date(Date.UTC(
            sessionDate.getUTCFullYear(),
            sessionDate.getUTCMonth(),
            sessionDate.getUTCDate(),
            parseInt(sHours),
            parseInt(sMinutes)
        ));

        const [eHours, eMinutes] = session.endTime.split(':');
        const sessionEnd = new Date(Date.UTC(
            sessionDate.getUTCFullYear(),
            sessionDate.getUTCMonth(),
            sessionDate.getUTCDate(),
            parseInt(eHours),
            parseInt(eMinutes)
        ));

        const timeUntilStart = sessionStart.getTime() - now.getTime();
        const timeSinceEnd = now.getTime() - sessionEnd.getTime();

        // 24 Hours Before
        if (timeUntilStart > 0 && timeUntilStart <= 24.5 * 60 * 60 * 1000 && timeUntilStart > 23 * 60 * 60 * 1000) {
            await notificationService.upsertNotification(
                booking.memberId._id,
                "Session Tomorrow",
                `Reminder: Your ${booking.sessionType} session "${session.name}" is scheduled for tomorrow at ${session.startTime}.`,
                "session",
                booking._id,
                "/dashboard"
            );
        }

        // 1 Hour Before
        if (timeUntilStart > 0 && timeUntilStart <= 65 * 60 * 1000 && timeUntilStart > 55 * 60 * 1000) {
            await notificationService.upsertNotification(
                booking.memberId._id,
                "Session in 1 Hour",
                `Your ${booking.sessionType} session "${session.name}" starts in 1 hour!`,
                "session",
                booking._id,
                "/dashboard"
            );

            // Notify Staff too (1h before)
            if (session.createdBy) {
                await notificationService.upsertNotification(
                    session.createdBy,
                    "Session Starting Soon",
                    `The session "${session.name}" you are managing starts in 1 hour.`,
                    "session",
                    session._id,
                    "/dashboard"
                );
            }
        }

        // 5 Minutes Before
        if (timeUntilStart > 0 && timeUntilStart <= 10 * 60 * 1000 && timeUntilStart > 0) {
            await notificationService.upsertNotification(
                booking.memberId._id,
                "Starting in 5 Minutes!",
                `Get ready! Your ${booking.sessionType} session "${session.name}" starts in 5 minutes.`,
                "session",
                booking._id,
                "/dashboard"
            );
        }

        // Session Just Ended (within 1 hour after completion)
        if (timeSinceEnd > 0 && timeSinceEnd <= 60 * 60 * 1000) {
            await notificationService.upsertNotification(
                booking.memberId._id,
                "Session has ended",
                `Your session "${session.name}" has ended. We hope you had a great workout!`,
                "session",
                booking._id,
                "/dashboard"
            );

            // Clear old reminders/status for this booking is handled in checkBookingStatus
        }
    }
};

const checkInventoryLevels = async () => {
    const lowStockItems = await Inventory.find({
        $or: [
            { quantity: { $lte: 0 } },
            { $expr: { $lte: ["$quantity", "$lowStockThreshold"] } }
        ]
    });

    if (lowStockItems.length > 0) {
        const staffAndAdmins = await User.find({ role: { $in: ['STAFF', 'ADMIN'] } });

        for (const item of lowStockItems) {
            const urgency = item.quantity <= 0 ? "OUT OF STOCK" : "Low Stock";
            const message = `${item.name} is ${urgency.toLowerCase()} (${item.quantity} remaining). Threshold: ${item.lowStockThreshold}.`;

            for (const staff of staffAndAdmins) {
                await notificationService.upsertNotification(
                    staff._id,
                    `Inventory Alert: ${urgency}`,
                    message,
                    "inventory",
                    item._id,
                    "/inventory"
                );
            }
        }
    }
};

const checkBookingStatus = async () => {
    const now = toNPT(new Date());
    const activeBookings = await Booking.find({ status: 'Booked' });
    const admins = await User.find({ role: 'ADMIN' });

    for (const booking of activeBookings) {
        let session;
        if (booking.sessionType === 'Boxing') {
            session = await BoxingSession.findById(booking.sessionId);
        } else {
            session = await SaunaSession.findById(booking.sessionId);
        }

        if (!session || !session.date || !session.endTime) {
            if (!session) {
                booking.status = 'Cancelled';
                await booking.save();
            }
            continue;
        }

        const sessionDate = new Date(session.date);
        const [hours, minutes] = session.endTime.split(':');
        const sessionEnd = new Date(Date.UTC(
            sessionDate.getUTCFullYear(),
            sessionDate.getUTCMonth(),
            sessionDate.getUTCDate(),
            parseInt(hours),
            parseInt(minutes)
        ));

        if (sessionEnd < now) {
            const attended = await Attendance.findOne({
                member: booking.memberId,
                date: new Date(session.date).setHours(0, 0, 0, 0)
            });

            if (attended) {
                booking.status = 'Completed';
            } else {
                booking.status = 'Expired';

                // Notify Admin about missed/expired session
                for (const admin of admins) {
                    await notificationService.createNotification(
                        admin._id,
                        "Missed Session Alert",
                        `Member ${booking.memberId} missed their ${booking.sessionType} session: ${session.name}.`,
                        "system",
                        booking._id,
                        "/bookings"
                    );
                }
            }
            await booking.save();
        }
    }
};

const cleanupOldBookings = async () => {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await Booking.deleteMany({
        status: { $in: ['Cancelled', 'Expired'] },
        updatedAt: { $lt: fortyEightHoursAgo }
    });
};

export default runReminderJobs;
