import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const createAnnouncement = async (adminId, data) => {
    const { title, message, targetRoles } = data;

    if (!title || !message) {
        throw new Error('Title and message are required');
    }

    // 1. Save the announcement first
    const announcement = new Announcement({
        title,
        message,
        targetRoles: Array.isArray(targetRoles) && targetRoles.length > 0
            ? targetRoles
            : ['MEMBER', 'STAFF', 'ADMIN'],
        createdBy: adminId
    });
    await announcement.save();
    console.log('[Announcement] Saved:', announcement._id.toString());

    // 2. Find target users — role is an array field, use $elemMatch for reliability
    let userQuery = {};
    const roles = announcement.targetRoles;
    if (roles && roles.length > 0) {
        userQuery = { role: { $elemMatch: { $in: roles } } };
    }

    let targetUsers = [];
    try {
        targetUsers = await User.find(userQuery).select('_id').lean();
        console.log(`[Announcement] Broadcasting to ${targetUsers.length} users`);
    } catch (err) {
        console.error('[Announcement] Failed to fetch target users:', err.message);
        // Still return announcement — it was saved
        return announcement;
    }

    // 3. Create notifications individually — don't let one failure kill everything
    const LIMIT = 15;
    let successCount = 0;

    for (const user of targetUsers) {
        try {
            const notification = new Notification({
                recipient: user._id,
                title: `[Announcement] ${title}`,
                message,
                type: 'system',
                relatedId: announcement._id,
                isRead: false
            });
            await notification.save();

            // Enforce 15-notification limit: delete oldest beyond limit
            const overflow = await Notification.find({ recipient: user._id })
                .sort({ createdAt: -1 })
                .skip(LIMIT)
                .select('_id')
                .lean();

            if (overflow.length > 0) {
                await Notification.deleteMany({ _id: { $in: overflow.map(n => n._id) } });
            }

            successCount++;
        } catch (err) {
            console.error(`[Announcement] Failed to notify user ${user._id}:`, err.message);
        }
    }

    console.log(`[Announcement] Notified ${successCount}/${targetUsers.length} users`);
    return announcement;
};

const getAnnouncements = async (userRole = null) => {
    const query = { status: 'Active' };

    // userRole from JWT is an array like ['ADMIN'], ['MEMBER'], etc.
    const roleStr = Array.isArray(userRole) ? userRole[0] : userRole;

    if (roleStr && roleStr !== 'ADMIN') {
        query.targetRoles = { $in: [roleStr] };
    }

    return await Announcement.find(query).sort({ createdAt: -1 });
};

const deleteAnnouncement = async (id) => {
    return await Announcement.findByIdAndDelete(id);
};

export default {
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement
};
