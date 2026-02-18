import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import InventoryComponent from '../components/InventoryComponent';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts';

// StatCard component for Staff Dashboard (Aligned with Admin)
const StatCard = ({ title, value, subtext, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    red: 'text-red-400'
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
      <div className="flex flex-col">
        <p className="text-sm text-gray-400 mb-1 font-medium">{title}</p>
        <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
        {subtext && <p className="text-gray-500 text-xs mt-2 font-medium">{subtext}</p>}
      </div>
    </div>
  );
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data state
  const [boxingSessions, setBoxingSessions] = useState([]);
  const [saunaSessions, setSaunaSessions] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  const [attendanceFilters, setAttendanceFilters] = useState({ onlyBooked: true });

  // Stats state
  const [stats, setStats] = useState({
    activeMembersToday: 0,
    sessionsToday: 0,
    newBookingsToday: 0,
    totalMembers: 0,
    conductedThisWeek: []
  });

  // Form states
  const [boxingForm, setBoxingForm] = useState({
    name: '', instructor: '', date: '', startTime: '', endTime: '', maxCapacity: '', description: ''
  });

  const [saunaForm, setSaunaForm] = useState({
    name: '', date: '', startTime: '', endTime: '', maxCapacity: '', temperature: '85', description: ''
  });

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    memberId: '',
    sessionId: '',
    sessionType: 'boxing' // 'boxing' or 'sauna'
  });

  const [editingSession, setEditingSession] = useState(null);
  const [showBoxingForm, setShowBoxingForm] = useState(false);
  const [showSaunaForm, setShowSaunaForm] = useState(false);

  useEffect(() => {
    checkStaffAccess();
    loadDashboardData();
  }, [activeTab]);

  const checkStaffAccess = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    if (!token || !userData.role || !userData.role.includes('STAFF')) {
      navigate('/dashboard');
      return;
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
      const currentUserId = (user.id || user._id || '').toString();

      const [boxingRes, saunaRes, bookingsRes, attRes, usersRes] = await Promise.all([
        apiRequest('/api/sessions/boxing'),
        apiRequest('/api/sessions/sauna'),
        apiRequest('/api/bookings'),
        apiRequest(`/api/attendance/reports?date=${todayStr}`),
        apiRequest('/api/users')
      ]);

      const boxers = Array.isArray(boxingRes) ? boxingRes : [];
      const saunas = Array.isArray(saunaRes) ? saunaRes : [];
      const bookings = Array.isArray(bookingsRes) ? bookingsRes : [];
      const attendance = Array.isArray(attRes) ? attRes : [];
      const users = Array.isArray(usersRes) ? usersRes : [];

      setBoxingSessions(boxers);
      setSaunaSessions(saunas);
      setAllBookings(bookings);
      setAttendanceRecords(attendance);

      const memberUsers = users.filter(u => u.role?.includes('MEMBER'));
      setMembers(memberUsers);
      setActiveMembers(memberUsers);

      // Calculate Stats
      const mySessionsToday = [...boxers, ...saunas].filter(s => {
        if (!s || !s.date) return false;
        const creatorId = (s.createdBy?._id || s.createdBy || '').toString();
        const isCreator = creatorId === currentUserId;
        const sessionDateStr = new Date(s.date).toLocaleDateString('en-CA');
        return isCreator && sessionDateStr === todayStr && s.status !== 'Cancelled';
      });

      const sessionsBookings = bookings.filter(b => {
        if (!b || !b.sessionId) return false;
        const bSessionId = b.sessionId.toString();
        return mySessionsToday.some(s => s._id.toString() === bSessionId) && b.status === 'Booked';
      });

      const uniqueMembersToday = new Set(
        sessionsBookings
          .map(b => (b.memberId?._id || b.memberId || '').toString())
          .filter(Boolean)
      );

      const newBookingsToday = bookings.filter(b => {
        if (!b || !b.createdAt || !b.sessionId) return false;
        const bookingDateStr = new Date(b.createdAt).toLocaleDateString('en-CA');
        const isToday = bookingDateStr === todayStr;
        const bSessionId = b.sessionId.toString();
        const isMySession = [...boxers, ...saunas].some(s => {
          const sId = s._id.toString();
          const creatorId = (s.createdBy?._id || s.createdBy || '').toString();
          return sId === bSessionId && creatorId === currentUserId;
        });
        return isToday && isMySession;
      }).length;

      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-CA');
      });

      const conductedData = last7Days.map(dateStr => {
        const count = [...boxers, ...saunas].filter(s => {
          if (!s || !s.date) return false;
          const creatorId = (s.createdBy?._id || s.createdBy || '').toString();
          const isCreator = creatorId === currentUserId;
          const sessionDateStr = new Date(s.date).toLocaleDateString('en-CA');
          return isCreator && sessionDateStr === dateStr && s.status === 'Completed';
        }).length;
        return {
          name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
          count
        };
      });

      setStats({
        activeMembersToday: uniqueMembersToday.size,
        sessionsToday: mySessionsToday.length,
        newBookingsToday,
        totalMembers: memberUsers.length,
        conductedThisWeek: conductedData
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to refresh dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (memberId) => {
    setError('');
    setSuccess('');
    try {
      await apiRequest('/api/attendance/mark', {
        method: 'POST',
        body: { memberId }
      });
      setSuccess('Attendance marked successfully!');
      loadDashboardData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to mark attendance');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const endpoint = bookingForm.sessionType === 'boxing'
        ? `/api/bookings/boxing/${bookingForm.sessionId}`
        : `/api/bookings/sauna/${bookingForm.sessionId}`;

      await apiRequest(endpoint, {
        method: 'POST',
        body: {
          sessionId: bookingForm.sessionId,
          memberId: bookingForm.memberId
        }
      });

      setSuccess(`${bookingForm.sessionType === 'boxing' ? 'Boxing' : 'Sauna'} session booked successfully for member!`);
      setBookingForm({ memberId: '', sessionId: '', sessionType: 'boxing' });
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to book session');
    } finally {
      setLoading(false);
    }
  };

  const handleBoxingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingSession) {
        await apiRequest(`/api/sessions/boxing/${editingSession._id}`, {
          method: 'PUT',
          body: boxingForm
        });
        setSuccess('Boxing session updated successfully!');
      } else {
        await apiRequest('/api/sessions/boxing', {
          method: 'POST',
          body: boxingForm
        });
        setSuccess('Boxing session created successfully!');
      }
      setBoxingForm({ name: '', instructor: '', date: '', startTime: '', endTime: '', maxCapacity: '', description: '' });
      setEditingSession(null);
      setShowBoxingForm(false);
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to save boxing session');
    } finally {
      setLoading(false);
    }
  };

  const handleSaunaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingSession) {
        await apiRequest(`/api/sessions/sauna/${editingSession._id}`, {
          method: 'PUT',
          body: saunaForm
        });
        setSuccess('Sauna session updated successfully!');
      } else {
        await apiRequest('/api/sessions/sauna', {
          method: 'POST',
          body: saunaForm
        });
        setSuccess('Sauna session created successfully!');
      }
      setSaunaForm({ name: '', date: '', startTime: '', endTime: '', maxCapacity: '', temperature: '85', description: '' });
      setEditingSession(null);
      setShowSaunaForm(false);
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to save sauna session');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (session, type) => {
    setEditingSession(session);
    if (type === 'boxing') {
      setBoxingForm({
        name: session.name,
        instructor: session.instructor,
        date: session.date.split('T')[0],
        startTime: session.startTime,
        endTime: session.endTime,
        maxCapacity: session.maxCapacity,
        description: session.description
      });
    } else {
      setSaunaForm({
        name: session.name,
        date: session.date.split('T')[0],
        startTime: session.startTime,
        endTime: session.endTime,
        maxCapacity: session.maxCapacity,
        temperature: session.temperature,
        description: session.description
      });
    }
    setActiveTab(type);
  };

  const handleCancel = async (sessionId, type) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;
    try {
      await apiRequest(`/api/sessions/${type}/${sessionId}/cancel`, { method: 'PATCH' });
      setSuccess('Session cancelled successfully!');
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to cancel session');
    }
  };

  const handleDelete = async (sessionId, type) => {
    if (!confirm('Are you sure you want to permanently delete this session?')) return;
    try {
      await apiRequest(`/api/sessions/${type}/${sessionId}`, { method: 'DELETE' });
      setSuccess('Session deleted successfully!');
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to delete session');
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-green-400 bg-green-900/30 border-green-500/20';
      case 'Cancelled': return 'text-red-400 bg-red-900/30 border-red-500/20';
      case 'Completed': return 'text-blue-400 bg-blue-900/30 border-blue-500/20';
      case 'Expired': return 'text-gray-500 bg-gray-800/30 border-gray-700';
      default: return 'text-gray-400 bg-gray-700/30 border-gray-600';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/dashboard" className="text-2xl font-bold text-green-400">
              Staff Dashboard
            </Link>
            <div className="flex items-center gap-6">
              <NotificationBell />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex flex-wrap mb-8 bg-slate-800 rounded-lg p-1 border border-slate-700">
          {[
            { id: 'home', label: 'Dashboard', icon: '🏠' },
            { id: 'bookings', label: 'Member Booking', icon: '📅' },
            { id: 'boxing', label: 'Boxing', icon: '🥊' },
            { id: 'sauna', label: 'Sauna', icon: '🏊‍♂️' },
            { id: 'attendance', label: 'Attendance', icon: '📋' },
            { id: 'inventory', label: 'Inventory', icon: '📦' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 flex items-center justify-center gap-2 ${activeTab === tab.id
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-slate-700'
                }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Global Messages */}
        {error && <div className="bg-red-600 text-white p-4 rounded-lg mb-6 shadow-xl animate-in slide-in-from-top duration-300">{error}</div>}
        {success && <div className="bg-green-600 text-white p-4 rounded-lg mb-6 shadow-xl animate-in slide-in-from-top duration-300">{success}</div>}

        {/* Dashboard Home */}
        {activeTab === 'home' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2">Welcome back, {user.name}!</h1>
              <p className="text-slate-400 font-medium">Here's an overview of your assigned tasks and sessions.</p>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Active Members Today" value={stats.activeMembersToday} subtext="Booked your sessions" color="blue" />
              <StatCard title="Sessions Today" value={stats.sessionsToday} subtext="Total to conduct today" color="purple" />
              <StatCard title="New Bookings Today" value={stats.newBookingsToday} subtext="Recent member interest" color="green" />
              <StatCard title="Total Members" value={stats.totalMembers} subtext="Registered in the system" color="purple" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Side: Upcoming Sessions Table */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
                  <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                    <h2 className="text-xl font-bold">Your Next 7 Days</h2>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upcoming Sessions</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-800/30">
                          <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Date & Time</th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Session / Type</th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Bookings</th>
                          <th className="px-8 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {[...boxingSessions, ...saunaSessions]
                          .filter(s => (s.createdBy?._id === (user.id || user._id) || s.createdBy === (user.id || user._id)) && new Date(s.date) >= new Date().setHours(0, 0, 0, 0))
                          .sort((a, b) => new Date(a.date) - new Date(b.date))
                          .slice(0, 7)
                          .map(session => (
                            <tr key={session._id} className="hover:bg-slate-800/30 transition-colors group">
                              <td className="px-8 py-5 text-sm">
                                <div className="font-bold text-white mb-1">
                                  {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                                <div className="text-slate-500 text-xs font-medium">{session.startTime} - {session.endTime}</div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="font-bold text-white group-hover:text-red-400 transition-colors">{session.name}</div>
                                <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider mt-1 ${session.instructor ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                  {session.instructor ? 'Boxing' : 'Sauna'}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-sm text-slate-300 font-medium">
                                {session.bookings?.length || 0} / {session.maxCapacity}
                              </td>
                              <td className="px-8 py-5 text-right">
                                <button
                                  onClick={() => { setActiveTab('attendance'); loadDashboardData(); }}
                                  className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-all shadow-sm"
                                >
                                  Manage Attendance
                                </button>
                              </td>
                            </tr>
                          ))}
                        {[...boxingSessions, ...saunaSessions].filter(s => s.createdBy?._id === user._id).length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-8 py-12 text-center text-slate-500 italic font-medium">
                              No upcoming sessions assigned to you.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Side: Charts & Performance */}
              <div className="space-y-8">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 shadow-xl">
                  <h2 className="text-lg font-bold mb-6 text-white">Conducting Performance</h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.conductedThisWeek}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} cursor={{ fill: '#1e293b' }} />
                        <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-slate-500 mt-6 text-center italic">Sessions completed in the last 7 days.</p>
                </div>

                <div className="bg-gradient-to-br from-red-900/40 to-slate-800 border border-red-500/20 p-6 rounded-lg flex items-center gap-4">
                  <div className="bg-red-500/20 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Remember to mark attendance as soon as a session concludes to maintain accurate records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Book for Member Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-white">Book Session for Member</h1>
            <div className="bg-slate-800 border border-slate-700 shadow-xl p-8 rounded-lg">
              <h2 className="text-xl font-bold text-white mb-6">Create New Booking</h2>
              <form onSubmit={handleBookingSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-3">Select Member</label>
                    <select
                      value={bookingForm.memberId}
                      onChange={(e) => setBookingForm({ ...bookingForm, memberId: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all cursor-pointer"
                      required
                    >
                      <option value="">-- Choose a Member --</option>
                      {members.map(member => (
                        <option key={member._id} value={member._id} className="bg-slate-800">
                          {member.name} ({member.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-3">Session Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['boxing', 'sauna'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBookingForm({ ...bookingForm, sessionType: type, sessionId: '' })}
                          className={`py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all border ${bookingForm.sessionType === type
                            ? 'bg-red-600 border-red-500 text-white shadow-lg'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-3">Select Active Session</label>
                  <select
                    value={bookingForm.sessionId}
                    onChange={(e) => setBookingForm({ ...bookingForm, sessionId: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all cursor-pointer"
                    required
                  >
                    <option value="">-- Select a Session --</option>
                    {(bookingForm.sessionType === 'boxing' ? boxingSessions : saunaSessions)
                      .filter(s => s.status === 'Active' && s.availableSlots > 0)
                      .map(session => (
                        <option key={session._id} value={session._id} className="bg-slate-800">
                          {session.name} • {new Date(session.date).toLocaleDateString()} ({session.startTime}-{session.endTime})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || !bookingForm.memberId || !bookingForm.sessionId}
                    className="w-full md:w-auto bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black py-4 px-12 rounded-lg shadow-xl transition-all uppercase tracking-widest text-sm"
                  >
                    {loading ? 'Processing...' : 'Confirm Member Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Boxing Sessions Management */}
        {activeTab === 'boxing' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-white text-gradient bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Boxing Sessions</h1>
              <button
                onClick={() => {
                  setShowBoxingForm(!showBoxingForm);
                  setEditingSession(null);
                  setBoxingForm({ name: '', instructor: '', date: '', startTime: '', endTime: '', maxCapacity: '', description: '' });
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
              >
                <span>{showBoxingForm ? 'Cancel' : '+ New Session'}</span>
              </button>
            </div>

            {showBoxingForm && (
              <div className="bg-slate-800 border border-slate-700 p-8 rounded-lg shadow-xl animate-in slide-in-from-top duration-300">
                <h2 className="text-xl font-bold text-white mb-6">{editingSession ? 'Edit Boxing Session' : 'Create New Boxing Session'}</h2>
                <form onSubmit={handleBoxingSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Session Name</label>
                      <input
                        type="text"
                        value={boxingForm.name}
                        onChange={(e) => setBoxingForm({ ...boxingForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="e.g. Morning Sparring"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Instructor</label>
                      <input
                        type="text"
                        value={boxingForm.instructor}
                        onChange={(e) => setBoxingForm({ ...boxingForm, instructor: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="e.g. Mike Tyson"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date</label>
                      <input
                        type="date"
                        value={boxingForm.date}
                        onChange={(e) => setBoxingForm({ ...boxingForm, date: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Time</label>
                        <input
                          type="time"
                          value={boxingForm.startTime}
                          onChange={(e) => setBoxingForm({ ...boxingForm, startTime: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">End Time</label>
                        <input
                          type="time"
                          value={boxingForm.endTime}
                          onChange={(e) => setBoxingForm({ ...boxingForm, endTime: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Max Capacity</label>
                      <input
                        type="number"
                        min="1"
                        value={boxingForm.maxCapacity}
                        onChange={(e) => setBoxingForm({ ...boxingForm, maxCapacity: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                    <textarea
                      value={boxingForm.description}
                      onChange={(e) => setBoxingForm({ ...boxingForm, description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white h-24 focus:ring-2 focus:ring-red-500 outline-none"
                      placeholder="Session details..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : (editingSession ? 'Update Session' : 'Create Session')}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-slate-800 border border-slate-700 p-8 rounded-lg shadow-xl">
              <h2 className="text-xl font-bold text-white mb-8">Recent Boxing Sessions</h2>
              <div className="grid gap-6">
                {boxingSessions.map(session => (
                  <div key={session._id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-red-500/30 transition-all group">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-white font-bold text-lg">{session.name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">Instructor: {session.instructor}</p>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(session.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {session.startTime}-{session.endTime}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {session.availableSlots}/{session.maxCapacity}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { handleEdit(session, 'boxing'); setShowBoxingForm(true); }}
                          className="p-2.5 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded-xl border border-slate-600 transition"
                          title="Edit Session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        {session.status === 'Active' && (
                          <button
                            onClick={() => handleCancel(session._id, 'boxing')}
                            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-orange-400 rounded-xl border border-slate-600 transition"
                            title="Cancel Session"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(session._id, 'boxing')}
                          className="p-2.5 bg-slate-700 hover:bg-slate-600 text-red-400 rounded-xl border border-slate-600 transition"
                          title="Delete Session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {boxingSessions.length === 0 && <div className="text-center py-12 text-slate-500 italic">No boxing sessions found.</div>}
              </div>
            </div>
          </div>
        )}

        {/* Sauna Sessions Management */}
        {activeTab === 'sauna' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-white text-gradient bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Sauna Sessions</h1>
              <button
                onClick={() => {
                  setShowSaunaForm(!showSaunaForm);
                  setEditingSession(null);
                  setSaunaForm({ name: '', date: '', startTime: '', endTime: '', maxCapacity: '', temperature: '85', description: '' });
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
              >
                <span>{showSaunaForm ? 'Cancel' : '+ New Session'}</span>
              </button>
            </div>

            {showSaunaForm && (
              <div className="bg-slate-800 border border-slate-700 p-8 rounded-lg shadow-xl animate-in slide-in-from-top duration-300">
                <h2 className="text-xl font-bold text-white mb-6">{editingSession ? 'Edit Sauna Session' : 'Create New Sauna Session'}</h2>
                <form onSubmit={handleSaunaSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Session Name</label>
                      <input
                        type="text"
                        value={saunaForm.name}
                        onChange={(e) => setSaunaForm({ ...saunaForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        placeholder="e.g. Steam Therapy"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Temperature (°C)</label>
                      <input
                        type="number"
                        value={saunaForm.temperature}
                        onChange={(e) => setSaunaForm({ ...saunaForm, temperature: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date</label>
                      <input
                        type="date"
                        value={saunaForm.date}
                        onChange={(e) => setSaunaForm({ ...saunaForm, date: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Time</label>
                        <input
                          type="time"
                          value={saunaForm.startTime}
                          onChange={(e) => setSaunaForm({ ...saunaForm, startTime: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">End Time</label>
                        <input
                          type="time"
                          value={saunaForm.endTime}
                          onChange={(e) => setSaunaForm({ ...saunaForm, endTime: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Max Capacity</label>
                      <input
                        type="number"
                        min="1"
                        value={saunaForm.maxCapacity}
                        onChange={(e) => setSaunaForm({ ...saunaForm, maxCapacity: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                    <textarea
                      value={saunaForm.description}
                      onChange={(e) => setSaunaForm({ ...saunaForm, description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white h-24 focus:ring-2 focus:ring-cyan-500 outline-none"
                      placeholder="Session details..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-md transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : (editingSession ? 'Update Session' : 'Create Session')}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-slate-800 border border-slate-700 p-8 rounded-lg shadow-xl">
              <h2 className="text-xl font-bold text-white mb-8">Recent Sauna Sessions</h2>
              <div className="grid gap-6">
                {saunaSessions.map(session => (
                  <div key={session._id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-blue-500/30 transition-all group">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-white font-bold text-lg">{session.name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">Temperature: {session.temperature}°C</p>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(session.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {session.startTime}-{session.endTime}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {session.availableSlots}/{session.maxCapacity}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { handleEdit(session, 'sauna'); setShowSaunaForm(true); }}
                          className="p-2.5 bg-slate-700 hover:bg-slate-600 text-cyan-400 rounded-xl border border-slate-600 transition"
                          title="Edit Session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        {session.status === 'Active' && (
                          <button
                            onClick={() => handleCancel(session._id, 'sauna')}
                            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-orange-400 rounded-xl border border-slate-600 transition"
                            title="Cancel Session"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(session._id, 'sauna')}
                          className="p-2.5 bg-slate-700 hover:bg-slate-600 text-red-400 rounded-xl border border-slate-600 transition"
                          title="Delete Session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {saunaSessions.length === 0 && <div className="text-center py-12 text-slate-500 italic">No sauna sessions found.</div>}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
              <div className="p-8 border-b border-slate-800 bg-slate-800/20 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Daily Attendance</h2>
                  <p className="text-slate-400 font-medium text-sm mt-1">Mark attendance for active members - {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 p-1 rounded-lg border border-slate-700 flex">
                    <button
                      onClick={() => setAttendanceFilters({ ...attendanceFilters, onlyBooked: false })}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!attendanceFilters.onlyBooked ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAttendanceFilters({ ...attendanceFilters, onlyBooked: true })}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${attendanceFilters.onlyBooked ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Booked Today
                    </button>
                  </div>
                  <button onClick={loadDashboardData} className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl border border-slate-700 transition" title="Refresh List">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/30">
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Member</th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Contact</th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Membership</th>
                      <th className="px-8 py-5 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Status / Note</th>
                      <th className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {members
                      .filter(m => {
                        if (!attendanceFilters.onlyBooked) return true;
                        return allBookings.some(b =>
                          (b.memberId?._id || b.memberId) === m._id &&
                          b.status === 'Booked' &&
                          new Date(b.bookingDate || b.createdAt).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')
                        );
                      })
                      .length === 0 ? (
                      <tr><td colSpan="5" className="px-8 py-16 text-center text-slate-500 italic">No members found for the selected view.</td></tr>
                    ) : (
                      members
                        .filter(m => {
                          if (!attendanceFilters.onlyBooked) return true;
                          return allBookings.some(b =>
                            (b.memberId?._id || b.memberId) === m._id &&
                            b.status === 'Booked' &&
                            new Date(b.bookingDate || b.createdAt).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')
                          );
                        })
                        .map(member => {
                          const isMarked = attendanceRecords.some(r => r.member?._id === member._id);
                          const isActive = member.membershipStatus === 'Active';
                          const isExpired = member.membershipExpiryDate && new Date(member.membershipExpiryDate) < new Date();
                          const canMarkInfo = isActive && !isExpired;

                          const todayBooking = allBookings.find(b =>
                            (b.memberId?._id || b.memberId) === member._id &&
                            b.status === 'Booked' &&
                            new Date(b.bookingDate || b.createdAt).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')
                          );

                          return (
                            <tr key={member._id} className={`transition-colors ${!canMarkInfo ? 'bg-slate-900/50 opacity-60' : 'hover:bg-slate-800/30'}`}>
                              <td className="px-8 py-5">
                                <div className="flex items-center">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black mr-4 ${canMarkInfo ? 'bg-gradient-to-br from-red-500 to-orange-600 shadow-lg' : 'bg-slate-700 text-slate-500'}`}>
                                    {member.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-white">{member.name}</div>
                                    {!isActive && <span className="text-[10px] text-red-400 font-extrabold uppercase">Inactive Account</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-sm text-slate-300 font-medium">{member.phone || '--'}</td>
                              <td className="px-8 py-5">
                                <div className="text-xs font-bold text-slate-400">
                                  {member.membershipExpiryDate ? new Date(member.membershipExpiryDate).toLocaleDateString() : 'No Plan'}
                                  {isExpired && <span className="ml-2 text-red-500 text-[10px] uppercase">(Expired)</span>}
                                </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <div className="flex flex-col items-center gap-2">
                                  {isMarked ? (
                                    <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-500/20">PRESENT</span>
                                  ) : (
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${canMarkInfo ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-red-900/20 text-red-500 border-red-900/30'}`}>
                                      {canMarkInfo ? 'PENDING' : 'INELIGIBLE'}
                                    </span>
                                  )}
                                  {todayBooking && (
                                    <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-tighter">
                                      Booked: {todayBooking.sessionType} ({todayBooking.sessionDetails?.startTime || 'Today'})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                {!isMarked ? (
                                  <button
                                    onClick={() => handleMarkAttendance(member._id)}
                                    disabled={!canMarkInfo}
                                    className={`text-xs font-bold px-5 py-2.5 rounded-xl transition ${canMarkInfo ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                                  >
                                    {canMarkInfo ? 'Mark Present' : 'Inactive'}
                                  </button>
                                ) : (
                                  <div className="text-green-500/80 text-xs font-black uppercase tracking-widest flex items-center justify-end gap-2 px-5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    Done
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <InventoryComponent />
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;