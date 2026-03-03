import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Attendance from '../models/Attendance.js';
import Inventory from '../models/Inventory.js';
import BoxingSession from '../models/BoxingSession.js';
import SaunaSession from '../models/SaunaSession.js';
import boxingService from '../services/boxingService.js';
import saunaService from '../services/saunaService.js';
import notificationService from '../services/notificationService.js';
import { toNPT, getNPTDateFromParts } from '../utils/dateUtils.js';
import { sendMembershipExpiryWarningEmail, sendSessionReminderEmail } from '../utils/mail.js';

const runReminderJobs = async () => {
    // console.log("🔔 Running background reminder jobs...");
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
    const notifyExpiry = async (days, label, slug) => {
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
            // Push Notification
            await notificationService.upsertNotification(
                user._id,
                `Membership Expiring in ${label}`,
                `Your membership will expire in ${label}. Please renew to avoid service interruption.`,
                "membership",
                user._id,
                "/profile"
            );

            // Email Notification (Only send once per milestone)
            if (!user.remindersSent) user.remindersSent = [];
            if (!user.remindersSent.includes(slug)) {
                await sendMembershipExpiryWarningEmail(user.email, user.name, user.membershipExpiryDate, label);
                user.remindersSent.push(slug);
                await user.save();
            }
        }
    };

    await notifyExpiry(7, "7 days", "7d");
    await notifyExpiry(1, "1 day", "1d");

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

        // Email Notification for Expiry
        if (!user.remindersSent) user.remindersSent = [];
        if (!user.remindersSent.includes("expired")) {
            await sendMembershipExpiryWarningEmail(user.email, user.name, user.membershipExpiryDate, "EXPIRED");
            user.remindersSent.push("expired");
            await user.save();
        }
    }
};

const checkSessionReminders = async () => {
    const now = new Date();
    // console.log(`[Job] Checking session reminders at ${now.toISOString()}`);

    // Member Reminders
    const bookings = await Booking.find({ status: 'Booked' }).populate('memberId');

    for (const booking of bookings) {
        try {
            if (!booking.memberId) continue;

            let session;
            if (booking.sessionType === 'Boxing') {
                session = await BoxingSession.findById(booking.sessionId);
            } else {
                session = await SaunaSession.findById(booking.sessionId);
            }

            if (!session || !session.date || session.status !== 'Active') continue;

            if (!booking.remindersSent) booking.remindersSent = [];

            // Get absolute UTC timestamp for session start
            const nptDate = toNPT(session.date);
            const dateStr = nptDate.toISOString().split('T')[0];
            const sessionStart = getNPTDateFromParts(dateStr, session.startTime);

            if (!sessionStart || isNaN(sessionStart.getTime())) {
                console.error(`Invalid session start for booking ${booking._id}: ${dateStr} ${session.startTime}`);
                continue;
            }

            const timeUntilStart = sessionStart.getTime() - now.getTime();

            // 24 Hours Before Reminder
            if (timeUntilStart > 2 * 60 * 60 * 1000 && timeUntilStart <= 24 * 60 * 60 * 1000) {
                if (!booking.remindersSent.includes('24h')) {
                    // Push Notification
                    await notificationService.createNotification(
                        booking.memberId._id,
                        "Session Tomorrow",
                        `Reminder: Your ${booking.sessionType} session "${session.name}" is scheduled for tomorrow at ${session.startTime} (NPT).`,
                        "session",
                        booking._id,
                        "/dashboard"
                    );

                    // Email Notification
                    await sendSessionReminderEmail(
                        booking.memberId.email,
                        booking.memberId.name,
                        {
                            name: session.name,
                            type: booking.sessionType,
                            startTime: session.startTime,
                            endTime: session.endTime
                        },
                        "Tomorrow"
                    );

                    booking.remindersSent.push('24h');
                    await booking.save();
                }
            }

            // 1 Hour Before Reminder (Up to 70m before to be safe)
            if (timeUntilStart > 10 * 60 * 1000 && timeUntilStart <= 70 * 60 * 1000) {
                if (!booking.remindersSent.includes('1h')) {
                    // console.log(`[Job] Sending 1h reminder for booking ${booking._id}, session ${session.name}`);
                    await notificationService.createNotification(
                        booking.memberId._id,
                        "Session in 1 Hour",
                        `Your ${booking.sessionType} session "${session.name}" starts in 1 hour at ${session.startTime}!`,
                        "session",
                        booking._id,
                        "/dashboard"
                    );

                    // Email Notification to Member
                    await sendSessionReminderEmail(
                        booking.memberId.email,
                        booking.memberId.name,
                        {
                            name: session.name,
                            type: booking.sessionType,
                            startTime: session.startTime,
                            endTime: session.endTime
                        },
                        "1 Hour"
                    );

                    // Notify Staff
                    if (session.createdBy) {
                        await notificationService.upsertNotification(
                            session.createdBy,
                            "Session Starting Soon",
                            `The session "${session.name}" you are managing starts in 1 hour.`,
                            "session",
                            session._id,
                            "/dashboard"
                        );
                        // Optional: Send email to staff as well? The user didn't explicitly ask but it's good practice.
                        // For now let's stick to the prompt.
                    }
                    booking.remindersSent.push('1h');
                    await booking.save();
                }
            }

            // Session Started Notification (Triggered at exactly start time or slightly after)
            if (timeUntilStart <= 0 && timeUntilStart > -15 * 60 * 1000) {
                if (!booking.remindersSent.includes('started')) {
                    // console.log(`[Job] Sending start notification for booking ${booking._id}`);
                    await notificationService.createNotification(
                        booking.memberId._id,
                        "Session Started",
                        `Your session "${session.name}" has started. Join fast!`,
                        "session",
                        booking._id,
                        "/dashboard"
                    );
                    booking.remindersSent.push('started');
                    await booking.save();
                }
            }
        } catch (err) {
            console.error(`Error processing reminder for booking ${booking._id}:`, err);
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
    const now = new Date(); // Actual current UTC time
    const activeBookings = await Booking.find({ status: 'Booked' });
    const admins = await User.find({ role: 'ADMIN' });

    for (const booking of activeBookings) {
        try {
            let session;
            if (booking.sessionType === 'Boxing') {
                session = await BoxingSession.findById(booking.sessionId);
            } else {
                session = await SaunaSession.findById(booking.sessionId);
            }

            if (!session) {
                booking.status = 'Cancelled';
                await booking.save();
                continue;
            }

            if (!session.date || !session.endTime) continue;

            // Get the absolute UTC timestamp for the session end
            const nptDate = toNPT(session.date);
            const dateStr = nptDate.toISOString().split('T')[0];
            const sessionEnd = getNPTDateFromParts(dateStr, session.endTime);

            if (!sessionEnd || isNaN(sessionEnd.getTime())) continue;

            if (now >= sessionEnd) {
                // console.log(`[Job] Marking booking ${booking._id} as completed/expired`);
                const attended = await Attendance.findOne({
                    member: booking.memberId,
                    date: new Date(session.date).setHours(0, 0, 0, 0)
                });

                if (!booking.remindersSent) booking.remindersSent = [];

                if (attended) {
                    booking.status = 'Completed';
                    await notificationService.createNotification(
                        booking.memberId,
                        "Session Completed",
                        `Your ${booking.sessionType} session "${session.name}" on ${new Date(session.date).toDateString()} has ended. We hope you enjoyed it!`,
                        "session",
                        booking._id,
                        "/dashboard"
                    );
                } else {
                    booking.status = 'Expired';

                    // Member Expiry Notification
                    await notificationService.createNotification(
                        booking.memberId,
                        "Session Expired",
                        `Your ${booking.sessionType} session "${session.name}" on ${new Date(session.date).toDateString()} at ${session.startTime} has expired.`,
                        "session",
                        booking._id,
                        "/dashboard"
                    );

                    // Notify Admin
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
                booking.remindersSent.push('expiry');
                await booking.save();
            }
        } catch (err) {
            console.error(`Error checking booking status for ${booking._id}:`, err);
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
