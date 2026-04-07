import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';

const StatCard = ({ title, value, subtext, color = 'blue' }) => {
    const colorClasses = {
        blue: 'text-neutral-400 border-neutral-500/20',
        green: 'text-green-400 border-green-500/20',
        orange: 'text-orange-400 border-orange-500/20',
        purple: 'text-purple-400 border-purple-500/20',
        red: 'text-red-400 border-red-500/20'
    };

    return (
        <div className={`bg-neutral-900/50 p-6 rounded-xl border ${colorClasses[color]} shadow-lg transition-all hover:scale-[1.02] duration-300`}>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">{title}</p>
            <div className={`text-3xl font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</div>
            {subtext && <p className="text-neutral-500 text-xs mt-2 font-medium">{subtext}</p>}
        </div>
    );
};

const AttendanceProgress = ({ completedThisMonth }) => {
    const totalDays = 30; // Target days per month
    const percentage = Math.min(Math.round((completedThisMonth / totalDays) * 100), 100);

    return (
        <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Regular Gym Attendance</h3>
                <span className="text-red-500 font-bold">{percentage}%</span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-3 mb-4">
                <div
                    className="bg-gradient-to-r from-red-600 to-red-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
                You have completed <span className="text-white">{completedThisMonth}</span> out of <span className="text-white">30</span> target monthly sessions.
            </p>
        </div>
    );
};

const AchievementsProgress = ({ data }) => {
    if (!data) return null;
    const { totalPoints, currentLevel, nextMilestone, progress } = data;

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl mb-12">
            <div className="px-8 py-6 border-b border-neutral-800 flex justify-between items-center bg-black/20">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">🏆</span> My Achievements
                </h2>
                <span className="bg-red-900/30 text-red-500 font-black px-4 py-1.5 rounded-full text-sm border border-red-500/20 shadow-lg shadow-red-900/20">
                    {totalPoints} Points
                </span>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-8 items-center">
                <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Current Level</p>
                    <div className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 mb-8">
                        {currentLevel ? (
                            <><span className="text-4xl filter drop-shadow-md">{currentLevel.icon}</span> {currentLevel.title}</>
                        ) : (
                            <><span className="text-4xl filter drop-shadow-md opacity-50">🌱</span> Beginner</>
                        )}
                    </div>

                    {nextMilestone && (
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Next Milestone</p>
                                    <p className="font-bold text-white flex items-center gap-2 text-sm">
                                        <span>{nextMilestone.icon}</span> {nextMilestone.title}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Points Needed</p>
                                    <p className="font-bold text-red-400 text-sm">{progress?.pointsNeeded} pts</p>
                                </div>
                            </div>
                            <div className="w-full bg-neutral-800 rounded-full h-4 mb-2 overflow-hidden border border-neutral-700">
                                <div
                                    className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full transition-all duration-1000 relative"
                                    style={{ width: `${progress?.percentage || 0}%` }}
                                >
                                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgogIDxwYXRoIGQ9Ik0wLDBMODwsOFogTTgsMEwwLDhaIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIzIiAvPgo8L3N2Zz4=')] opacity-30 animate-pulse"></div>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-neutral-500 text-right tracking-widest uppercase">{totalPoints} / {nextMilestone.pointsRequired} pts</p>
                        </div>
                    )}
                    {!nextMilestone && currentLevel && (
                        <div className="text-sm font-bold text-green-500 border border-green-500/20 bg-green-900/10 p-4 rounded-xl flex items-center gap-3">
                            <span className="text-2xl">🎉</span> You have reached the maximum achievement level!
                        </div>
                    )}
                </div>

                <div className="md:border-l border-t md:border-t-0 border-neutral-800 md:pl-8 pt-8 md:pt-0">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        Unlocked Achievements ({data.unlockedAchievements?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {data.unlockedAchievements?.length > 0 ? (
                            data.unlockedAchievements.map(ua => (
                                <div key={ua._id} className="bg-neutral-800/80 border border-neutral-700 px-4 py-2.5 rounded-xl flex items-center gap-3 hover:bg-neutral-700 transition shadow-lg hover:-translate-y-1 group" title={ua.milestone?.rewardDescription || "Unlocked"}>
                                    <span className="text-2xl drop-shadow-md group-hover:scale-110 transition-transform">{ua.milestone?.icon}</span>
                                    <div>
                                        <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors uppercase tracking-wider">{ua.milestone?.title}</p>
                                        <p className="text-[9px] text-neutral-500 font-medium">{new Date(ua.unlockedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="w-full border border-dashed border-neutral-700 rounded-xl p-6 text-center">
                                <span className="text-3xl opacity-20 block mb-2">🏅</span>
                                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">No achievements yet</p>
                                <p className="text-[10px] text-neutral-600 mt-1">Keep training to unlock milestones!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pointLog, setPointLog] = useState([]);

    const [plans, setPlans] = useState([]);
    const [achievements, setAchievements] = useState(null);
    const [renewing, setRenewing] = useState(false);
    const [showRenewModal, setShowRenewModal] = useState(false);

    const isStaff = user.role && user.role.includes('STAFF');

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.role?.includes('ADMIN')) {
            navigate('/admin-dashboard');
            return;
        }
        if (userData.role?.includes('STAFF')) {
            navigate('/staff-dashboard');
            return;
        }
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bookingsData, attendanceData, plansData, profileData, achievementsData, pointLogData] = await Promise.all([
                apiRequest('/api/bookings/my-bookings'),
                apiRequest('/api/attendance/my'),
                user.role?.includes('MEMBER') ? apiRequest('/api/membership/plans') : Promise.resolve([]),
                apiRequest(`/api/users/${user._id || user.id || 'me'}`),
                user.role?.includes('MEMBER') ? apiRequest('/api/achievements/my-progress').catch(() => null) : Promise.resolve(null),
                user.role?.includes('MEMBER') ? apiRequest('/api/achievements/history').catch(() => []) : Promise.resolve([])
            ]);

            setBookings(Array.isArray(bookingsData) ? bookingsData : []);
            setAttendanceHistory(Array.isArray(attendanceData) ? attendanceData : []);
            setPlans(Array.isArray(plansData) ? plansData : []);
            setAchievements(achievementsData);
            setPointLog(Array.isArray(pointLogData) ? pointLogData : []);

            if (profileData && (profileData._id || profileData.id)) {
                // Ensure we maintain consistency if id was expected elsewhere
                const updatedUser = {
                    ...profileData,
                    id: profileData._id || profileData.id
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (err) {
            console.error("Failed to load dashboard data", err);
            setError("Failed to sync your dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await apiRequest(`/api/bookings/${id}`, { method: 'DELETE' });
            setSuccess("Booking cancelled successfully.");
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || "Failed to cancel booking");
        }
    };

    const handleRenew = async (plan, category) => {
        if (!window.confirm(`Renew with ${plan.name} (${category.name}) for NPR ${category.price.toLocaleString()}?`)) return;
        setRenewing(true);
        try {
            const res = await apiRequest('/api/membership/purchase', {
                method: 'POST',
                body: {
                    planId: plan._id,
                    categoryName: category.name
                }
            });
            if (res.payment_url) {
                window.location.href = res.payment_url;
            }
        } catch (err) {
            setError(err.message || "Failed to initiate renewal");
            setRenewing(false);
        }
    };

    // Filter and sort the bookings
    const upcomingBookings = bookings
        .filter(b => {
            if (b.status !== "Booked") return false;
            if (!b.sessionDetails?.date) return false;
            const sessionDate = new Date(b.sessionDetails.date);
            const now = new Date();
            // Session is in future or today
            return sessionDate >= new Date(now.setHours(0, 0, 0, 0));
        })
        .sort((a, b) => new Date(a.sessionDetails.date) - new Date(b.sessionDetails.date));

    const pastBookings = bookings
        .filter(b => {
            if (["Completed", "Expired", "Cancelled"].includes(b.status)) return true;
            // Also include "Booked" sessions that have already passed but not yet marked by cron
            if (b.status === "Booked" && b.sessionDetails?.date) {
                const sessionDate = new Date(b.sessionDetails.date);
                return sessionDate < new Date(new Date().setHours(0, 0, 0, 0));
            }
            return false;
        })
        .sort((a, b) => new Date(b.sessionDetails?.date || b.bookingDate) - new Date(a.sessionDetails?.date || a.bookingDate));

    const countUpcomingNext7Days = upcomingBookings.filter(b => {
        const sessionDate = new Date(b.sessionDetails.date);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return sessionDate < nextWeek;
    }).length;

    const totalAttended = attendanceHistory.filter(r => r.status === 'Present').length;

    // Check how many times they've been to the gym this month
    const nowLocal = new Date();
    const firstDayOfMonth = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1);
    const completedThisMonth = attendanceHistory.filter(r => {
        const rDate = new Date(r.date);
        return r.status === 'Present' && rDate >= firstDayOfMonth && rDate <= nowLocal;
    }).length;

    // Make the expiry date look nice and readable
    const expiryDateFormatted = user.membershipExpiryDate
        ? new Date(user.membershipExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';

    const statusColorMap = {
        'Active': 'green',
        'Expired': 'red',
        'Pending': 'orange'
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30">
            <nav className="bg-black/80 backdrop-blur-md border-b border-neutral-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                            Dharan Fitness Club
                        </Link>
                        <div className="flex items-center gap-6">
                            {isStaff && (
                                <Link to="/staff-dashboard" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                                    Staff Dashboard
                                </Link>
                            )}
                            <NotificationBell />
                            <UserMenu />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-6 sm:py-12">
                {/* Header Section */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 capitalize">Welcome back, {user.name?.toLowerCase()}!</h1>
                        <p className="text-neutral-400 font-medium text-sm sm:text-base">Here's what's happening with your membership today.</p>
                    </div>
                    {user.membershipType && (
                        <div className="bg-red-500/10 border border-red-500/20 px-4 sm:px-6 py-4 rounded-2xl flex-shrink-0 mt-4 md:mt-0">
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] mb-1">Current Plan</p>
                            <p className="text-base font-bold text-white tracking-tight">{user.membershipType}</p>
                        </div>
                    )}
                </div>

                {/* Status Messages */}
                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">{error}</div>}
                {success && <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">{success}</div>}

                {/* 4 Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        title="Membership Status"
                        value={user.membershipStatus || 'Pending'}
                        color={statusColorMap[user.membershipStatus] || 'orange'}
                    />
                    <StatCard
                        title="Expiry Date"
                        value={expiryDateFormatted}
                        subtext="Renew anytime to stay active"
                        color="blue"
                    />
                    <StatCard
                        title="Upcoming Sessions"
                        value={countUpcomingNext7Days}
                        subtext="In the next 7 days"
                        color="purple"
                    />
                    <StatCard
                        title="Total Attended"
                        value={totalAttended}
                        subtext="All-time sessions"
                        color="green"
                    />
                </div>

                {/* Achievements Section */}
                {achievements && <AchievementsProgress data={achievements} />}

                {/* Point History Log */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl mb-12">
                    <div className="px-8 py-6 border-b border-neutral-800 bg-black/20 flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-2xl">⚡</span> Point History Log
                        </h2>
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700">
                            Recent Activity
                        </span>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-black/40">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Reason</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Method</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/50">
                                {pointLog.length > 0 ? (
                                    pointLog.map((log) => (
                                        <tr key={log._id} className="hover:bg-neutral-800/30 transition-colors group">
                                            <td className="px-8 py-5 text-sm font-bold text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                                                {log.reason}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-neutral-800 text-neutral-400 border border-neutral-700">
                                                    {log.source}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-xs font-bold text-neutral-500 uppercase tracking-tighter">
                                                {new Date(log.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <span className={`text-sm font-black ${log.points >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {log.points >= 0 ? '+' : ''}{log.points}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-12 text-center text-neutral-600 italic text-sm uppercase tracking-widest font-bold">
                                            No point history yet. Keep pushing your limits!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Schedule and Actions */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Upcoming Sessions Section */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                            <div className="px-8 py-6 border-b border-neutral-800 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-bold">Upcoming Sessions</h2>
                                <Link to="/book-session" className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-wider">Book New</Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-black/30">
                                            <th className="px-3 sm:px-8 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Session</th>
                                            <th className="px-3 sm:px-8 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Date &amp; Time</th>
                                            <th className="hidden sm:table-cell px-3 sm:px-8 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Instructor</th>
                                            <th className="px-3 sm:px-8 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800">
                                        {upcomingBookings.slice(0, 7).map(booking => (
                                            <tr key={booking._id} className="hover:bg-neutral-800/30 transition-colors group">
                                                <td className="px-3 sm:px-8 py-5">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${booking.sessionType === 'Boxing' ? 'bg-red-900/30 text-red-400' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}>
                                                        {booking.sessionType}
                                                    </span>
                                                    <div className="font-bold text-white group-hover:text-red-500 transition-colors">{booking.sessionDetails?.name}</div>
                                                </td>
                                                <td className="px-3 sm:px-8 py-5 text-sm text-neutral-300">
                                                    <div className="font-medium">{new Date(booking.sessionDetails?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                    <div className="text-neutral-500 text-xs">{booking.sessionDetails?.startTime} - {booking.sessionDetails?.endTime}</div>
                                                </td>
                                                <td className="hidden sm:table-cell px-3 sm:px-8 py-5 text-sm text-neutral-400 font-medium">
                                                    {booking.sessionDetails?.instructor || 'Staff'}
                                                </td>
                                                <td className="px-3 sm:px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => handleCancelBooking(booking._id)}
                                                        className="text-neutral-500 hover:text-red-500 transition-colors p-2"
                                                        title="Cancel Session"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {upcomingBookings.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-12 text-center text-neutral-500 italic font-medium">
                                                    No upcoming sessions booked. Time to hit the gym!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* NEW: Booking History Section */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                            <div className="px-8 py-6 border-b border-neutral-800 flex justify-between items-center bg-black/20">
                                <h2 className="text-xl font-bold">Booking History</h2>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Past & Expired</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-black/30">
                                            <th className="px-8 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Session</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800">
                                        {pastBookings.slice(0, 10).map(booking => (
                                            <tr key={booking._id} className="hover:bg-neutral-800/30 transition-colors group">
                                                <td className="px-8 py-4">
                                                    <div className="font-bold text-white text-sm">{booking.sessionDetails?.name || booking.sessionType}</div>
                                                    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-tighter">{booking.sessionType} Session</div>
                                                </td>
                                                <td className="px-8 py-4 text-sm text-neutral-400">
                                                    {booking.sessionDetails?.date ? new Date(booking.sessionDetails.date).toLocaleDateString() : new Date(booking.bookingDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${booking.status === 'Completed' ? 'bg-green-900/30 text-green-400' :
                                                        booking.status === 'Expired' ? 'bg-red-900/30 text-red-400' :
                                                            booking.status === 'Cancelled' ? 'bg-neutral-800 text-neutral-400' :
                                                                'bg-orange-900/30 text-orange-400'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {pastBookings.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-8 py-12 text-center text-neutral-500 italic font-medium">
                                                    No past bookings found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* NEW: Attendance History Section */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                            <div className="px-8 py-6 border-b border-neutral-800 bg-black/20">
                                <h2 className="text-xl font-bold">Attendance History</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-black/30">
                                            <th className="px-8 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Marked By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800">
                                        {attendanceHistory.slice(0, 10).map(record => (
                                            <tr key={record._id} className="hover:bg-neutral-800/30 transition-colors">
                                                <td className="px-8 py-4">
                                                    <div className="text-sm font-medium text-white">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-sm text-neutral-500">
                                                    {record.markedBy?.name || 'Staff'}
                                                </td>
                                            </tr>
                                        ))}
                                        {attendanceHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-8 py-12 text-center text-neutral-500 italic font-medium">
                                                    No attendance history found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Attendance Progress Visual (Mobile/Table) */}
                        <div className="lg:hidden">
                            <AttendanceProgress completedThisMonth={completedThisMonth} />
                        </div>
                    </div>

                    {/* Right Column: Actions & Progress */}
                    <div className="space-y-8">
                        {/* Quick Actions Card */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl">
                            <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
                            <div className="space-y-4">
                                <Link to="/book-session" className="flex items-center justify-between w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-red-900/20 group">
                                    Book Session
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </Link>
                                <button
                                    onClick={() => setShowRenewModal(true)}
                                    className="flex items-center justify-between w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-4 px-6 rounded-xl transition-all border border-neutral-800 group"
                                >
                                    Renew Membership
                                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                                <Link to="/profile" className="flex items-center justify-between w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-4 px-6 rounded-xl transition-all border border-neutral-800 group">
                                    View Profile
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </Link>
                            </div>
                        </div>

                        {/* Attendance Progress Visual (Desktop) */}
                        <div className="hidden lg:block">
                            <AttendanceProgress completedThisMonth={completedThisMonth} />
                        </div>

                        {/* Simple Info Badge */}
                        <div className="bg-gradient-to-br from-red-900/20 to-neutral-900 border border-red-500/20 p-6 rounded-2xl flex items-center gap-4">
                            <div className="bg-red-500/20 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                                Consistency is key! Regular attendance helps you achieve your fitness goals faster.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {showRenewModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-neutral-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-neutral-800 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-black/20">
                            <div>
                                <h2 className="text-2xl font-bold">Renew Membership</h2>
                                <p className="text-neutral-400 text-sm mt-1">Select a plan to extend your fitness journey.</p>
                            </div>
                            <button
                                onClick={() => setShowRenewModal(false)}
                                className="bg-neutral-800 hover:bg-neutral-700 p-2 rounded-full transition-colors"
                                title="Close"
                            >
                                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-4 sm:p-8 overflow-y-auto flex-1">
                            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                                {plans.map(plan => (
                                    <div key={plan._id} className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 transition-all hover:border-neutral-700 group flex flex-col">
                                        <div className="mb-6 pb-6 border-b border-neutral-800/50">
                                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                            <p className="text-neutral-400 text-sm">{plan.description || `${plan.durationMonths} Month Unlimited access`}</p>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Select Category</p>
                                            {plan.categories.map((cat, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleRenew(plan, cat)}
                                                    disabled={renewing}
                                                    className="w-full bg-black border border-neutral-800 hover:border-red-500/50 p-4 rounded-2xl flex justify-between items-center group/btn transition-all hover:bg-neutral-800"
                                                >
                                                    <span className="text-sm font-bold text-neutral-300 group-hover/btn:text-white">{cat.name}</span>
                                                    <div className="text-right">
                                                        <span className="text-red-500 font-black">NPR {cat.price.toLocaleString()}</span>
                                                        <div className="text-[10px] text-neutral-500 font-bold group-hover/btn:text-red-500 transition-colors uppercase mt-0.5">Select & Renew</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-auto">
                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">Features Included</p>
                                            <ul className="space-y-3">
                                                {plan.features.map((f, i) => (
                                                    <li key={i} className="text-sm text-neutral-400 flex items-center gap-3">
                                                        <div className="w-5 h-5 rounded-full bg-red-600/10 flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
