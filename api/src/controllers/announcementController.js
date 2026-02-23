import announcementService from '../services/announcementService.js';

const getAnnouncements = async (req, res) => {
    try {
        const announcements = await announcementService.getAnnouncements(req.user.role);
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcements', error: error.message });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        console.log('[AnnouncementController] Creating announcement, adminId:', req.user?.id, 'body:', req.body);
        const announcement = await announcementService.createAnnouncement(req.user.id, req.body);
        res.status(201).json(announcement);
    } catch (error) {
        console.error('[AnnouncementController] Error creating announcement:', error);
        res.status(500).json({ message: error.message || 'Error creating announcement' });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        await announcementService.deleteAnnouncement(req.params.id);
        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting announcement', error: error.message });
    }
};

export default {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement
};
