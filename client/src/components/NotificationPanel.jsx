import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const NotificationPanel = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/api/notifications');
            setNotifications(data.notifications || []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'membership': return 'bg-blue-500';
            case 'booking': return 'bg-green-500';
            case 'session': return 'bg-red-500';
            case 'inventory': return 'bg-orange-500';
            default: return 'bg-slate-500';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[60] overflow-hidden flex flex-col max-h-[500px] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/40">
                <div>
                    <h3 className="text-sm font-bold text-white">Notifications</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Stay Updated</p>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 transition uppercase tracking-tighter"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3">
                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-gray-500 font-medium">Loading alerts...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-3xl mb-3 opacity-20">🔔</div>
                        <p className="text-sm text-gray-400 font-medium">All caught up!</p>
                        <p className="text-[10px] text-gray-500 mt-1">No new notifications at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {notifications.map((n) => (
                            <div
                                key={n._id}
                                className={`p-4 hover:bg-slate-700/30 transition duration-200 relative group ${!n.isRead ? 'bg-red-500/5' : ''}`}
                            >
                                {!n.isRead && (
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500"></div>
                                )}
                                <div className="flex gap-4">
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${getTypeColor(n.type)}`}></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-xs font-bold truncate pr-4 ${!n.isRead ? 'text-white' : 'text-gray-400'}`}>
                                                {n.title}
                                            </h4>
                                            <span className="text-[9px] text-gray-500 whitespace-nowrap pt-0.5">
                                                {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-relaxed mb-3 line-clamp-2">
                                            {n.message}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto">
                                            {n.actionUrl ? (
                                                <Link
                                                    to={n.actionUrl}
                                                    onClick={() => {
                                                        markAsRead(n._id);
                                                        onClose();
                                                    }}
                                                    className="text-[10px] font-bold text-red-500 hover:text-red-400 transition uppercase tracking-widest flex items-center gap-1.5"
                                                >
                                                    View Details
                                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                                </Link>
                                            ) : (
                                                <div className="w-1"></div>
                                            )}

                                            {!n.isRead && (
                                                <button
                                                    onClick={() => markAsRead(n._id)}
                                                    className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-gray-500 hover:text-white transition uppercase tracking-tighter"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-slate-700 bg-slate-900/20 text-center">
                <button
                    onClick={onClose}
                    className="text-[10px] font-bold text-gray-500 hover:text-white transition uppercase tracking-widest"
                >
                    Close Panel
                </button>
            </div>
        </div>
    );
};

export default NotificationPanel;
