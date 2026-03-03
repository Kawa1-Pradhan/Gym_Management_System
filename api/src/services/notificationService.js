import Notification from '../models/Notification.js';

const createNotification = async (userId, title, message, type, relatedId = null, actionUrl = null) => {
    try {
        const notification = new Notification({
            recipient: userId,
            title,
            message,
            type,
            relatedId,
            actionUrl
        });
        await notification.save();

        // Limit to latest 15 notifications per user
        const oldNotifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .skip(15);

        if (oldNotifications.length > 0) {
            const idsToDelete = oldNotifications.map(n => n._id);
            await Notification.deleteMany({ _id: { $in: idsToDelete } });
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

const upsertNotification = async (userId, title, message, type, relatedId, actionUrl = null) => {
    try {
        const query = { recipient: userId, type };
        if (relatedId) query.relatedId = relatedId;

        const existing = await Notification.findOne(query);

        if (existing) {
            // Only mark as unread and update content if title or message actually changed
            const isContentSame = existing.title === title && existing.message === message;

            const update = { actionUrl, createdAt: new Date() };
            if (!isContentSame) {
                update.title = title;
                update.message = message;
                update.isRead = false;
            }

            return await Notification.findByIdAndUpdate(
                existing._id,
                update,
                { returnDocument: 'after' }
            );
        } else {
            // New notification
            return await Notification.create({
                recipient: userId,
                title,
                message,
                type,
                relatedId,
                actionUrl,
                isRead: false
            });
        }
    } catch (error) {
        console.error('Error upserting notification:', error);
        return null;
    }
};

const deleteByRelatedId = async (relatedId) => {
    try {
        await Notification.deleteMany({ relatedId });
    } catch (error) {
        console.error('Error deleting notifications by relatedId:', error);
    }
};

const getUserNotifications = async (userId, limit = 15) => {
    return await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(Number(limit));
};

const getUnreadCount = async (userId) => {
    return await Notification.countDocuments({ recipient: userId, isRead: false });
};

const markAsRead = async (notificationId, userId) => {
    return await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true },
        { returnDocument: 'after' }
    );
};

const markAllAsRead = async (userId) => {
    return await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
    );
};

export default {
    createNotification,
    upsertNotification,
    deleteByRelatedId,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
