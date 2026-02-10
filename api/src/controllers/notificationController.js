import notificationService from '../services/notificationService.js';

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getUserNotifications(req.user.id);
        const unreadCount = await notificationService.getUnreadCount(req.user.id);
        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error in getMyNotifications:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const markRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id, req.user.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        console.error('Error in markRead:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const markAllRead = async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user.id);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error in markAllRead:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export default {
    getMyNotifications,
    markRead,
    markAllRead
};
