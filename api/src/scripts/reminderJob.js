import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Attendance from '../models/Attendance.js';
import boxingService from '../services/boxingService.js';
import saunaService from '../services/saunaService.js';
import notificationService from '../services/notificationService.js';

const runReminderJobs = async () => {
    console.log('🔔 Running background reminder jobs...');
    try {
        await checkMembershipExpiry();
        await checkSessionReminders();
        await checkBookingStatus();
        await cleanupOldBookings();
    } catch (error) {
        console.error('❌ Error in reminder jobs:', error);
    }
};

const checkMembershipExpiry = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check for 7-day expiry
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const sevenDayUsers = await User.find({
        role: 'MEMBER',
        membershipExpiryDate: {
            $gte: sevenDaysFromNow,
            $lt: new Date(sevenDaysFromNow.getTime() + 24 * 60 * 60 * 1000)
        }
    });

    for (const user of sevenDayUsers) {
        await notificationService.createNotification(
            user._id,
            "Membership Expiring Soon",
            "Your membership will expire in 7 days. Please renew to avoid service interruption.",
            "membership"
        );
    }

    // 2. Check for 3-day expiry
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const threeDayUsers = await User.find({
        role: 'MEMBER',
        membershipExpiryDate: {
            $gte: threeDaysFromNow,
            $lt: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000)
        }
    });

    for (const user of threeDayUsers) {
        await notificationService.createNotification(
            user._id,
            "Membership Expiring Soon",
            "Your membership will expire in 3 days. Please renew soon!",
            "membership"
        );
    }

    // 3. Check for expired today
    const expiredUsers = await User.find({
        role: 'MEMBER',
        membershipExpiryDate: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
    });

    for (const user of expiredUsers) {
        await notificationService.createNotification(
            user._id,
            "Membership Expired",
            "Your membership has expired. Some services may be restricted until renewal.",
            "membership"
        );
    }
};

const checkSessionReminders = async () => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find active bookings
    const bookings = await Booking.find({ status: 'Booked' }).populate('memberId');

    for (const booking of bookings) {
        let session;
        if (booking.sessionType === 'Boxing') {
            session = await boxingService.getSessionById(booking.sessionId);
        } else {
            session = await saunaService.getSessionById(booking.sessionId);
        }

        if (!session || !session.date) continue;

        // Construct session start time
        const sessionStartTime = new Date(session.date);
        const [hours, minutes] = session.startTime.split(':');
        sessionStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const timeUntilSession = sessionStartTime.getTime() - now.getTime();
        const oneHourMs = 60 * 60 * 1000;
        const twoHoursMs = 2 * 60 * 60 * 1000;

        // Notify if between 1 and 2 hours away
        // We should probably track if they were already notified for this session to avoid spamming
        // For this simple version, we'll just check if it's within the window.
        // Ideally we'd add 'notifiedReminders' array to Booking model.

        if (timeUntilSession > 0 && timeUntilSession <= twoHoursMs && timeUntilSession > oneHourMs) {
            // Send reminder if not already sent (optional enhancement)
            await notificationService.createNotification(
                booking.memberId._id,
                "Upcoming Session Reminder",
                `Your ${booking.sessionType} session "${session.name}" starts in less than 2 hours at ${session.startTime}.`,
                "session"
            );
        }
    }
};

const checkBookingStatus = async () => {
    const now = new Date();

    // Find all active 'Booked' bookings
    const activeBookings = await Booking.find({ status: 'Booked' });

    for (const booking of activeBookings) {
        let session;
        if (booking.sessionType === 'Boxing') {
            session = await boxingService.getSessionById(booking.sessionId);
        } else {
            session = await saunaService.getSessionById(booking.sessionId);
        }

        if (!session || !session.date || !session.endTime) continue;

        const sessionEnd = new Date(session.date);
        const [hours, minutes] = session.endTime.split(':');
        sessionEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (sessionEnd < now) {
            // Check if they attended
            const attended = await Attendance.findOne({
                member: booking.memberId,
                date: new Date(session.date).setHours(0, 0, 0, 0)
            });

            booking.status = attended ? 'Completed' : 'Expired';
            await booking.save();
        }
    }
};

const cleanupOldBookings = async () => {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Remove Cancelled or Expired bookings older than 48 hours
    await Booking.deleteMany({
        status: { $in: ['Cancelled', 'Expired'] },
        updatedAt: { $lt: fortyEightHoursAgo }
    });
};

export default runReminderJobs;
