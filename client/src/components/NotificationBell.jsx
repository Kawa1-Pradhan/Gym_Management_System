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
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'membership': return 'bg-purple-500';
            case 'booking': return 'bg-green-500';
            case 'session': return 'bg-blue-500';
            case 'profile': return 'bg-orange-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                        <h3 className="font-bold text-sm text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 italic text-sm">
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    onClick={() => !notif.isRead && markAsRead(notif._id)}
                                    className={`p-4 border-b border-slate-700/50 cursor-pointer transition-colors hover:bg-slate-700/30 ${!notif.isRead ? 'bg-slate-700/20' : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${getTypeColor(notif.type)}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h4 className={`text-xs font-bold truncate ${!notif.isRead ? 'text-white' : 'text-slate-400'}`}>
                                                    {notif.title}
                                                </h4>
                                                <span className="text-[9px] text-slate-500 shrink-0 mt-0.5">
                                                    {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className={`text-[11px] leading-relaxed line-clamp-2 ${!notif.isRead ? 'text-slate-300' : 'text-slate-500'}`}>
                                                {notif.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 bg-slate-800/80 text-center border-t border-slate-700">
                        <span className="text-[10px] text-slate-500 font-medium tracking-tight">Only members receive in-app notifications.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
