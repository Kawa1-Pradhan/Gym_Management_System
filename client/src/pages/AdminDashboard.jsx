import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import UserMenu from '../components/UserMenu';
import InventoryComponent from '../components/InventoryComponent';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// StatCard component for summary metrics
const StatCard = ({ title, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400'
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
      <div className="flex flex-col">
        <p className="text-sm text-gray-400 mb-1 font-medium">{title}</p>
        <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
      </div>
    </div>
  );
};

// Helper component for individual Plan card to manage local state
const PlanCard = ({ plan, onUpdate }) => {
  const [price, setPrice] = useState(plan.price);
  const [discount, setDiscount] = useState(plan.discountPercent);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onUpdate(plan._id, { price: Number(price), discountPercent: Number(discount) });
    setLoading(false);
  };

  const finalPrice = price - (price * discount / 100);

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg relative">
      <div className="absolute top-4 right-4">
        <span className={`px-2 py-1 rounded text-xs font-bold ${plan.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
          {plan.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
      <div className="space-y-4 mt-4">
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Price (NPR)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Discount (%)</label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            min="0"
            max="100"
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
          />
        </div>
        <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
          <div className="text-sm">
            <span className="text-gray-400">Final: </span>
            <span className="text-green-400 font-bold">
              NPR {finalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate(plan._id, { isActive: !plan.isActive })}
              className="text-xs underline text-blue-400"
            >
              {plan.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold py-2 px-3 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('home'); // renamed from overview
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceFilters, setAttendanceFilters] = useState({ date: '', memberId: '' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeBookings: 0,
    totalSessions: 0,
    staffMembers: 0
  });
  const navigate = useNavigate();

  // Form states
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    password: '123456789' // Default password
  });

  useEffect(() => {
    checkAdminAccess();
    loadData();
  }, [activeTab, attendanceFilters]);

  const checkAdminAccess = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token || !userData.role || !userData.role.includes('ADMIN')) {
      navigate('/dashboard');
      return;
    }

    setUser(userData);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch all data concurrently
      const [usersRes, bookingsRes, boxingRes, saunaRes, plansRes] = await Promise.all([
        apiRequest('/api/users'),
        apiRequest('/api/bookings'),
        apiRequest('/api/sessions/boxing'),
        apiRequest('/api/sessions/sauna'),
        apiRequest('/api/membership/plans')
      ]);

      const fetchedUsers = Array.isArray(usersRes) ? usersRes : [];
      const fetchedBookings = Array.isArray(bookingsRes) ? bookingsRes : [];
      const fetchedBoxing = Array.isArray(boxingRes) ? boxingRes : [];
      const fetchedSauna = Array.isArray(saunaRes) ? saunaRes : [];
      const fetchedPlans = Array.isArray(plansRes) ? plansRes : [];

      const fetchedSessions = [
        ...fetchedBoxing.map(s => ({ ...s, type: 'Boxing' })),
        ...fetchedSauna.map(s => ({ ...s, type: 'Sauna' }))
      ];

      // Update basic states
      setUsers(fetchedUsers);
      setBookings(fetchedBookings);
      setSessions(fetchedSessions);
      setPlans(fetchedPlans);

      // Load attendance reports if that tab is active
      if (activeTab === 'attendance') {
        try {
          let url = '/api/attendance/reports';
          const params = new URLSearchParams();
          if (attendanceFilters.date) params.append('date', attendanceFilters.date);
          if (attendanceFilters.memberId) params.append('memberId', attendanceFilters.memberId);
          if (params.toString()) url += `?${params.toString()}`;

          const reports = await apiRequest(url);
          setAttendanceRecords(Array.isArray(reports) ? reports : []);
        } catch (err) {
          console.error('Error loading attendance reports:', err);
        }
      }

      // Calculate stats for overview using the LOCAL variables (fetchedUsers, etc.)
      const members = fetchedUsers.filter(u => u.role?.includes('MEMBER'));
      const activeMembers = members.filter(m => m.isActive !== false);
      const inactiveMembers = members.filter(m => m.isActive === false);

      // Monthly revenue (current month)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyRevenue = members
        .filter(m => {
          if (!m.membershipStartDate) return false;
          const startDate = new Date(m.membershipStartDate);
          return startDate >= firstDayOfMonth && startDate <= now;
        })
        .reduce((sum, m) => {
          const plan = fetchedPlans.find(p => p.name === m.membershipType);
          if (plan) {
            const finalPrice = plan.price - (plan.price * (plan.discountPercent || 0) / 100);
            return sum + finalPrice;
          }
          return sum;
        }, 0);

      // Memberships expiring soon (within 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const expiringSoon = members.filter(m => {
        if (!m.membershipExpiryDate) return false;
        const endDate = new Date(m.membershipExpiryDate);
        return endDate >= now && endDate <= sevenDaysFromNow;
      }).length;

      // Plan distribution
      const planCounts = {};
      fetchedPlans.forEach(p => { planCounts[p.name] = 0; });
      members.forEach(m => {
        if (m.membershipType && m.membershipType !== 'None') {
          planCounts[m.membershipType] = (planCounts[m.membershipType] || 0) + 1;
        }
      });

      const planDistribution = Object.entries(planCounts).map(([name, count]) => ({
        name,
        count
      }));

      // Active sessions today
      const today = new Date();
      const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
      const activeSessionsToday = fetchedSessions.filter(s => {
        if (!s || !s.date) return false;
        const sDate = new Date(s.date).toLocaleDateString('en-CA');
        return sDate === todayStr && s.status === 'Active';
      }).length;

      // New members this month
      const newMembersThisMonth = members.filter(m => {
        if (!m.createdAt) return false;
        const createdDate = new Date(m.createdAt);
        return createdDate >= firstDayOfMonth && createdDate <= now;
      }).length;

      // Most booked session type
      const boxingCount = fetchedBookings.filter(b => b.sessionType === 'Boxing').length;
      const saunaCount = fetchedBookings.filter(b => b.sessionType === 'Sauna').length;
      let mostBookedType = 'N/A';
      if (boxingCount > 0 || saunaCount > 0) {
        if (boxingCount > saunaCount) mostBookedType = 'Boxing';
        else if (saunaCount > boxingCount) mostBookedType = 'Sauna';
        else mostBookedType = 'Both Equal';
      }

      setStats({
        activeMembers: activeMembers.length,
        inactiveMembers: inactiveMembers.length,
        monthlyRevenue,
        expiringSoon,
        planDistribution,
        totalMembers: members.length,
        activeSessionsToday,
        newMembersThisMonth,
        mostBookedType,
        totalUsers: fetchedUsers.length,
        activeBookings: fetchedBookings.filter(b => b.status === 'Booked').length,
        totalSessions: fetchedSessions.length,
        staffMembers: fetchedUsers.filter(u => u.role?.includes('STAFF')).length
      });

    } catch (err) {
      console.error('Error in loadData:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (planId, updates) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await apiRequest(`/api/membership/plans/${planId}`, { method: 'PATCH', body: updates });
      setSuccess('Plan updated successfully');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || "Failed to update plan");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...newStaff,
          role: 'STAFF',
          membershipStatus: 'Active'
        }
      });

      setSuccess('Staff member created successfully!');
      setNewStaff({ name: '', email: '', phone: '', password: '123456789' });
      setActiveTab('users');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let endpoint = '';
      let method = 'POST';
      let confirmMsg = '';

      switch (action) {
        case 'Deactivate':
        case 'Activate':
          endpoint = `/api/users/${userId}/deactivate`;
          method = 'PATCH';
          confirmMsg = `Are you sure you want to ${action.toLowerCase()} this user?`;
          break;
        case 'Reset Password':
          endpoint = `/api/users/${userId}/reset-password`;
          confirmMsg = 'Generate a new password and send it via email?';
          break;
        case 'Resend Credentials':
          endpoint = `/api/users/${userId}/resend-credentials`;
          confirmMsg = 'Resend enrollment credentials to this user?';
          break;
        default: return;
      }

      if (window.confirm(confirmMsg)) {
        await apiRequest(endpoint, { method });
        setSuccess(`${action} successful!`);
        await loadData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || `Failed to ${action}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-12">
      {/* Navigation */}
      <nav className="bg-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-2xl font-bold text-green-400">
                Admin Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap mb-8 bg-slate-800 rounded-lg p-1 border border-slate-700">
          {['home', 'users', 'bookings', 'sessions', 'attendance', 'plans', 'inventory'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 capitalize ${activeTab === tab
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-slate-700'
                }`}
            >
              {tab === 'bookings' ? 'Bookings' :
                tab === 'sessions' ? 'Sessions' :
                  tab === 'attendance' ? 'Attendance' :
                    tab === 'plans' ? 'Plans' :
                      tab === 'inventory' ? 'Inventory' :
                        tab === 'home' ? 'Dashboard' : 'Users'}
            </button>
          ))}
        </div>

        {/* Messages */}
        {error && <div className="bg-red-600 text-white p-4 rounded-lg mb-6">{error}</div>}
        {success && <div className="bg-green-600 text-white p-4 rounded-lg mb-6">{success}</div>}

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'home' && (
            <div>
              <h1 className="text-3xl font-bold mb-8 text-gradient bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Admin Dashboard</h1>

              {/* Quick Stats Section */}
              <div className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Members"
                    value={stats.totalMembers || 0}
                    color="blue"
                  />
                  <StatCard
                    title="Sessions Today"
                    value={stats.activeSessionsToday || 0}
                    color="purple"
                  />
                  <StatCard
                    title="New This Month"
                    value={stats.newMembersThisMonth || 0}
                    color="green"
                  />
                  <StatCard
                    title="Top Session"
                    value={stats.mostBookedType || 'N/A'}
                    color="orange"
                  />
                </div>
              </div>

              {/* Membership Metrics Section */}
              <div className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Membership Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Active Members"
                    value={stats.activeMembers || 0}
                    color="green"
                  />
                  <StatCard
                    title="Inactive Members"
                    value={stats.inactiveMembers || 0}
                    color="orange"
                  />
                  <StatCard
                    title="Monthly Revenue"
                    value={`NPR ${(stats.monthlyRevenue || 0).toLocaleString()}`}
                    color="blue"
                  />
                  <StatCard
                    title="Expiring Soon"
                    value={stats.expiringSoon || 0}
                    color="purple"
                  />
                </div>
              </div>

              {/* Best-selling Plans Graph */}
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 mb-8">
                <h3 className="text-xl font-bold mb-6 text-white">Best-Selling Membership Plans</h3>
                <div className="h-80 w-full">
                  {stats.planDistribution && stats.planDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.planDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                          itemStyle={{ color: '#4ade80' }}
                          cursor={{ stroke: '#334155', strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#4ade80"
                          strokeWidth={3}
                          dot={{ fill: '#4ade80', r: 6 }}
                          activeDot={{ r: 8, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 italic">
                      No plan data available
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 mb-8">
                <h3 className="text-xl font-bold mb-4 text-white">Recent Bookings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Member</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Session Type</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {bookings.filter(b => !['Expired', 'Cancelled'].includes(b.status)).slice(0, 5).map(booking => (
                        <tr key={booking._id} className="hover:bg-slate-700/30">
                          <td className="px-4 py-3 text-sm text-white">{booking.memberId?.name || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${booking.sessionType === 'Boxing' ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'
                              }`}>
                              {booking.sessionType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {booking.sessionDetails?.date ? new Date(booking.sessionDetails.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full font-bold">
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-gray-500 italic">
                            No recent bookings
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">User Management</h1>
                <button onClick={() => setActiveTab('create-staff')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-bold">Add Staff</button>
              </div>
              <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">User</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-slate-700/30">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-300 capitalize">{u.role.join(', ')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.isActive === false ? 'bg-red-900/30 text-red-500' : 'bg-green-900/30 text-green-500'}`}>
                            {u.isActive === false ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button onClick={() => handleUserAction(u._id, u.isActive === false ? 'Activate' : 'Deactivate')} className="text-xs text-blue-400 hover:underline">Toggle</button>
                          <button onClick={() => handleUserAction(u._id, 'Reset Password')} className="text-xs text-purple-400 hover:underline">Reset</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'create-staff' && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Create Staff Member</h1>
              <div className="bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-700 max-w-2xl mx-auto">
                <form onSubmit={handleCreateStaff} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                      <input type="text" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                      <input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
                    <input type="tel" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white" required />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition">
                    {loading ? 'Processing...' : 'Register Staff Account'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Booking Oversight</h1>
              <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 bg-slate-700/30">
                  <h3 className="font-bold">Active Reservations</h3>
                </div>
                <div className="divide-y divide-slate-700">
                  {bookings.filter(b => b.status === "Booked").map(b => (
                    <div key={b._id} className="p-6 flex justify-between items-center hover:bg-slate-700/20">
                      <div>
                        <div className="font-bold text-white">{b.memberId?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-400">{b.sessionType} • {b.sessionDetails?.name}</div>
                      </div>
                      <button onClick={async () => {
                        if (window.confirm("Cancel this booking?")) {
                          try {
                            setLoading(true);
                            setError('');
                            setSuccess('');
                            const res = await apiRequest(`/api/bookings/${b._id}`, { method: 'DELETE' });
                            setSuccess(res.message || "Booking cancelled successfully.");
                            await loadData();
                            setTimeout(() => setSuccess(''), 3000);
                          } catch (err) {
                            setError(err.message || "Failed to cancel booking");
                          } finally {
                            setLoading(false);
                          }
                        }
                      }} className="text-red-500 text-sm font-bold hover:underline">Cancel Booking</button>
                    </div>
                  ))}
                  {bookings.filter(b => b.status === "Booked").length === 0 && (
                    <div className="p-12 text-center text-gray-500 italic">No active bookings found</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Session Management</h1>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map(s => (
                  <div key={s._id} className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.type === "Boxing" ? "bg-red-900/50 text-red-400" : "bg-blue-900/50 text-blue-400"}`}>
                        {s.type}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${s.status === "Active" ? "text-green-500" : "text-red-500"}`}>
                        {s.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{s.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">Capacity: {s.availableSlots} / {s.maxCapacity}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button onClick={async () => {
                        const n = prompt("New Max Capacity?", s.maxCapacity);
                        if (n) {
                          await apiRequest(`/api/sessions/${s.type.toLowerCase()}/${s._id}`, { method: 'PUT', body: { maxCapacity: parseInt(n) } });
                          loadData();
                        }
                      }} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition">Capacity</button>
                      <button onClick={async () => {
                        if (window.confirm(`Delete this session?`)) {
                          await apiRequest(`/api/sessions/${s.type.toLowerCase()}/${s._id}`, { method: 'DELETE' });
                          loadData();
                        }
                      }} className="bg-red-900/30 text-red-400 hover:bg-red-900/50 px-3 py-1.5 rounded transition">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Attendance Reports</h1>
              <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 bg-slate-700/30 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Member</label>
                    <select
                      value={attendanceFilters.memberId}
                      onChange={(e) => setAttendanceFilters({ ...attendanceFilters, memberId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white"
                    >
                      <option value="">All Members</option>
                      {users.filter(u => u.role?.includes('MEMBER')).map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Date</label>
                    <input
                      type="date"
                      value={attendanceFilters.date}
                      onChange={(e) => setAttendanceFilters({ ...attendanceFilters, date: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white"
                    />
                  </div>
                  <button onClick={() => setAttendanceFilters({ date: '', memberId: '' })} className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-md font-bold transition">Reset</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Member</th>
                        <th className="px-12 py-4 text-left text-xs font-bold text-gray-400 uppercase">Marked By</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {attendanceRecords.map(r => (
                        <tr key={r._id} className="hover:bg-slate-700/30">
                          <td className="px-6 py-4 text-sm text-gray-300">{new Date(r.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-white">{r.member?.name}</div>
                            <div className="text-[10px] text-gray-500">{r.member?.email}</div>
                          </td>
                          <td className="px-12 py-4 text-sm text-gray-400">{r.markedBy?.name}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="px-2 py-0.5 bg-green-900/40 text-green-400 rounded text-[10px] font-bold uppercase border border-green-500/20">{r.status}</span>
                          </td>
                        </tr>
                      ))}
                      {attendanceRecords.length === 0 && (
                        <tr><td colSpan="4" className="p-12 text-center text-gray-500 italic">No attendance records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}






          {activeTab === 'plans' && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Membership Plans</h1>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                  <PlanCard key={plan._id} plan={plan} onUpdate={handleUpdatePlan} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <InventoryComponent />
          )}

        </div>
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>&copy; 2026 Dharan Fitness Club. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;