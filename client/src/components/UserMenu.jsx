import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest, API_BASE_URL } from '../utils/api';

const UserMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser.id) {
            fetchUserData(storedUser.id);
        }

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUserData = async (userId) => {
        try {
            const data = await apiRequest(`/api/users/${userId}`);
            setUser(data);
        } catch (err) {
            console.error('Failed to fetch user data for menu', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    if (!user) return null;

    const role = user.role?.[0] || 'MEMBER';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Avatar Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 focus:outline-none group p-1 rounded-full hover:bg-slate-700/50 transition duration-300"
            >
                <div className="w-10 h-10 rounded-full border-2 border-slate-700 group-hover:border-red-600 transition duration-300 overflow-hidden bg-slate-800 flex items-center justify-center text-white font-bold">
                    {user.profileImageUrls?.[0] ? (
                        <img
                            src={`${API_BASE_URL}${user.profileImageUrls[0]}`}
                            alt={user.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        user.name?.charAt(0)
                    )}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-bold text-white group-hover:text-red-400 transition tracking-wide">{user.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{role}</p>
                </div>
                <svg className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-700 bg-slate-700/30">
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    <div className="p-2">
                        <Link
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            View Settings
                        </Link>
                    </div>

                    <div className="p-2 border-t border-slate-700 bg-slate-900/20">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
