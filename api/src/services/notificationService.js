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

        return await Notification.findOneAndUpdate(
            query,
            { title, message, actionUrl, isRead: false, createdAt: new Date() },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
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
