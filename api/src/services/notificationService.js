import Notification from '../models/Notification.js';

const createNotification = async (userId, title, message, type) => {
    try {
        const notification = new Notification({
            recipient: userId,
            title,
            message,
            type
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        // We don't necessarily want to crash the main process if a notification fails
        return null;
    }
};

const getUserNotifications = async (userId, limit = 20) => {
    return await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(limit);
};

const getUnreadCount = async (userId) => {
    return await Notification.countDocuments({ recipient: userId, isRead: false });
};

const markAsRead = async (notificationId, userId) => {
    return await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true },
        { new: true }
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
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
