import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';

// Helper component to show the small summary cards at the top
const StatCard = ({ title, value, subtext, color = 'blue' }) => {
    const colorClasses = {
        blue: 'text-blue-400 border-blue-500/20',
        green: 'text-green-400 border-green-500/20',
        orange: 'text-orange-400 border-orange-500/20',
        purple: 'text-purple-400 border-purple-500/20',
        red: 'text-red-400 border-red-500/20'
    };

    return (
        <div className={`bg-slate-800/50 p-6 rounded-xl border ${colorClasses[color]} shadow-lg transition-all hover:scale-[1.02] duration-300`}>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{title}</p>
            <div className={`text-3xl font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</div>
            {subtext && <p className="text-gray-500 text-xs mt-2 font-medium">{subtext}</p>}
        </div>
    );
};

// This shows a progress bar of how many days the member has visited this month
const AttendanceProgress = ({ completedThisMonth }) => {
    const totalDays = 30; // Target days per month
    const percentage = Math.min(Math.round((completedThisMonth / totalDays) * 100), 100);

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Regular Gym Attendance</h3>
                <span className="text-cyan-400 font-bold">{percentage}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
                <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <p className="text-xs text-gray-500 font-medium">
                You have completed <span className="text-white">{completedThisMonth}</span> out of <span className="text-white">30</span> target monthly sessions.
            </p>
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

    const [plans, setPlans] = useState([]);
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
            const [bookingsData, attendanceData, plansData, profileData] = await Promise.all([
                apiRequest('/api/bookings/my-bookings'),
                apiRequest('/api/attendance/my'),
                user.role?.includes('MEMBER') ? apiRequest('/api/membership/plans') : Promise.resolve([]),
                apiRequest(`/api/users/${user._id || user.id || 'me'}`)
            ]);

            setBookings(Array.isArray(bookingsData) ? bookingsData : []);
            setAttendanceHistory(Array.isArray(attendanceData) ? attendanceData : []);
            setPlans(Array.isArray(plansData) ? plansData : []);

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
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
            {/* Navigation */}
            <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Dharan Fitness Club
                        </Link>
                        <div className="flex items-center gap-6">
                            {isStaff && (
                                <Link to="/staff-dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                    Staff Dashboard
                                </Link>
                            )}
                            <NotificationBell />
                            <UserMenu />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Header Section */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-white mb-2">Welcome back, {user.name}!</h1>
                        <p className="text-slate-400 font-medium">Here's what's happening with your membership today.</p>
                    </div>
                    {user.membershipType && (
                        <div className="bg-cyan-500/10 border border-cyan-500/20 px-6 py-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] mb-1">Current Plan</p>
                            <p className="text-xl font-bold text-white">{user.membershipType}</p>
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

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Schedule and Actions */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Upcoming Sessions Section */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                            <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                                <h2 className="text-xl font-bold">Upcoming Sessions</h2>
                                <Link to="/book-session" className="text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider">Book New</Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-800/30">
                                            <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Session</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Date & Time</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Instructor</th>
                                            <th className="px-8 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {upcomingBookings.slice(0, 7).map(booking => (
                                            <tr key={booking._id} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${booking.sessionType === 'Boxing' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                        {booking.sessionType}
                                                    </span>
                                                    <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{booking.sessionDetails?.name}</div>
                                                </td>
                                                <td className="px-8 py-5 text-sm text-slate-300">
                                                    <div className="font-medium">{new Date(booking.sessionDetails?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                    <div className="text-slate-500 text-xs">{booking.sessionDetails?.startTime} - {booking.sessionDetails?.endTime}</div>
                                                </td>
                                                <td className="px-8 py-5 text-sm text-slate-400 font-medium">
                                                    {booking.sessionDetails?.instructor || 'Staff'}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => handleCancelBooking(booking._id)}
                                                        className="text-slate-500 hover:text-red-500 transition-colors p-2"
                                                        title="Cancel Session"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {upcomingBookings.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-12 text-center text-slate-500 italic font-medium">
                                                    No upcoming sessions booked. Time to hit the gym!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* NEW: Booking History Section */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                            <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                                <h2 className="text-xl font-bold">Booking History</h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Past & Expired</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-800/30">
                                            <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Session</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {pastBookings.slice(0, 10).map(booking => (
                                            <tr key={booking._id} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-8 py-4">
                                                    <div className="font-bold text-white text-sm">{booking.sessionDetails?.name || booking.sessionType}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{booking.sessionType} Session</div>
                                                </td>
                                                <td className="px-8 py-4 text-sm text-slate-400">
                                                    {booking.sessionDetails?.date ? new Date(booking.sessionDetails.date).toLocaleDateString() : new Date(booking.bookingDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${booking.status === 'Completed' ? 'bg-green-900/30 text-green-400' :
                                                        booking.status === 'Expired' ? 'bg-red-900/30 text-red-400' :
                                                            booking.status === 'Cancelled' ? 'bg-slate-800 text-slate-400' :
                                                                'bg-orange-900/30 text-orange-400'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {pastBookings.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-8 py-12 text-center text-slate-500 italic font-medium">
                                                    No past bookings found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* NEW: Attendance History Section */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                            <div className="px-8 py-6 border-b border-slate-800 bg-slate-800/20">
                                <h2 className="text-xl font-bold">Attendance History</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-800/30">
                                            <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Marked By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {attendanceHistory.slice(0, 10).map(record => (
                                            <tr key={record._id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-8 py-4">
                                                    <div className="text-sm font-medium text-white">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-sm text-slate-500">
                                                    {record.markedBy?.name || 'Staff'}
                                                </td>
                                            </tr>
                                        ))}
                                        {attendanceHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-8 py-12 text-center text-slate-500 italic font-medium">
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
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                            <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
                            <div className="space-y-4">
                                <Link to="/book-session" className="flex items-center justify-between w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-cyan-900/20 group">
                                    Book Session
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </Link>
                                <button
                                    onClick={() => setShowRenewModal(true)}
                                    className="flex items-center justify-between w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-6 rounded-xl transition-all border border-slate-700 group"
                                >
                                    Renew Membership
                                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                                <Link to="/profile" className="flex items-center justify-between w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-6 rounded-xl transition-all border border-slate-700 group">
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
                        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 p-6 rounded-2xl flex items-center gap-4">
                            <div className="bg-indigo-500/20 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                Consistency is key! Regular attendance helps you achieve your fitness goals faster.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* The popup window for renewing a membership */}
            {showRenewModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
                        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                            <div>
                                <h2 className="text-2xl font-bold">Renew Membership</h2>
                                <p className="text-slate-400 text-sm mt-1">Select a plan to extend your fitness journey.</p>
                            </div>
                            <button
                                onClick={() => setShowRenewModal(false)}
                                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"
                                title="Close"
                            >
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto">
                            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                                {plans.map(plan => (
                                    <div key={plan._id} className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 transition-all hover:border-slate-600 group flex flex-col">
                                        <div className="mb-6 pb-6 border-b border-slate-700/50">
                                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                            <p className="text-slate-400 text-sm">{plan.description || `${plan.durationMonths} Month Unlimited access`}</p>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Category</p>
                                            {plan.categories.map((cat, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleRenew(plan, cat)}
                                                    disabled={renewing}
                                                    className="w-full bg-slate-900 border border-slate-700 hover:border-cyan-500/50 p-4 rounded-2xl flex justify-between items-center group/btn transition-all hover:bg-slate-800"
                                                >
                                                    <span className="text-sm font-bold text-slate-300 group-hover/btn:text-white">{cat.name}</span>
                                                    <div className="text-right">
                                                        <span className="text-cyan-400 font-black">NPR {cat.price.toLocaleString()}</span>
                                                        <div className="text-[10px] text-slate-500 font-bold group-hover/btn:text-cyan-500 transition-colors uppercase mt-0.5">Select & Renew</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-auto">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Features Included</p>
                                            <ul className="space-y-3">
                                                {plan.features.map((f, i) => (
                                                    <li key={i} className="text-sm text-slate-400 flex items-center gap-3">
                                                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
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
