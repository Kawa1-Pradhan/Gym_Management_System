import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../utils/api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await apiRequest('/api/notifications');
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
            // Update locally — keep the item visible, just flip isRead
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
            // Update all locally — keep items visible
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'membership': return { icon: '💳', color: 'bg-purple-500/20 text-purple-400' };
            case 'booking': return { icon: '📅', color: 'bg-green-500/20 text-green-400' };
            case 'session': return { icon: '💪', color: 'bg-blue-500/20 text-blue-400' };
            case 'system': return { icon: '📢', color: 'bg-red-500/20 text-red-500' };
            default: return { icon: '🔔', color: 'bg-slate-500/20 text-slate-400' };
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white transition-all transform hover:scale-105 active:scale-95 focus:outline-none"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-lg ring-2 ring-slate-900 animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-85 sm:w-96 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-200 origin-top-right backdrop-blur-xl">
                    <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
                        <div>
                            <h3 className="font-black text-sm text-white tracking-tight">Notifications</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{unreadCount} Unread</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors p-1 bg-red-500/10 rounded"
                            >
                                Mark All Read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                </div>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">No Notifications</p>
                                <p className="text-[11px] text-slate-600 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const styles = getTypeStyles(notif.type);
                                return (
                                    <div
                                        key={notif._id}
                                        className={`p-5 border-b border-slate-700/30 transition-all group ${!notif.isRead ? 'cursor-pointer hover:bg-slate-800/50' : 'opacity-60'}`}
                                        onClick={() => !notif.isRead && markAsRead(notif._id)}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`mt-0.5 h-10 w-10 rounded-xl shrink-0 flex items-center justify-center text-lg ${styles.color} transition-transform group-hover:scale-110 shadow-lg`}>
                                                {styles.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1.5">
                                                    <h4 className={`text-[13px] font-black leading-tight transition-colors ${!notif.isRead ? 'text-white group-hover:text-red-400' : 'text-slate-400'}`}>
                                                        {notif.title}
                                                    </h4>
                                                    {!notif.isRead && (
                                                        <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                                                    )}
                                                </div>
                                                <p className="text-[11px] leading-relaxed text-slate-400 line-clamp-3 mb-2 font-medium">
                                                    {notif.message}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                                        {timeAgo(notif.createdAt)}
                                                    </span>
                                                    {!notif.isRead && (
                                                        <>
                                                            <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                                                            <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-widest">
                                                                Tap to dismiss
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
