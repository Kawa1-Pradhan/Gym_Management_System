import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import UserMenu from '../components/UserMenu';

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
  const [activeTab, setActiveTab] = useState('overview');
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
      // Load users
      if (activeTab === 'overview' || activeTab === 'users' || activeTab === 'attendance') {
        try {
          const response = await apiRequest('/api/users');
          setUsers(Array.isArray(response) ? response : []);
        } catch (err) {
          console.error('Error loading users:', err);
        }
      }

      // Load bookings
      if (activeTab === 'overview' || activeTab === 'bookings') {
        try {
          const allBookings = await apiRequest('/api/bookings');
          setBookings(Array.isArray(allBookings) ? allBookings : []);
        } catch (err) {
          console.error('Error loading bookings:', err);
        }
      }

      // Load sessions
      if (activeTab === 'overview' || activeTab === 'sessions') {
        try {
          const boxingSessions = await apiRequest('/api/sessions/boxing');
          const saunaSessions = await apiRequest('/api/sessions/sauna');

          const allSessions = [
            ...Array.isArray(boxingSessions) ? boxingSessions.map(s => ({ ...s, type: 'Boxing' })) : [],
            ...Array.isArray(saunaSessions) ? saunaSessions.map(s => ({ ...s, type: 'Sauna' })) : []
          ];
          setSessions(allSessions);
        } catch (err) {
          console.error('Error loading sessions:', err);
        }
      }

      // Load plans
      if (activeTab === 'overview' || activeTab === 'plans') {
        try {
          const res = await apiRequest('/api/membership/plans'); // Ensure this endpoint returns all plans (or add /admin/plans for all including inactive)
          setPlans(Array.isArray(res) ? res : []);
        } catch (err) {
          console.error("Error loading plans", err);
        }
      }

      // Load attendance filters
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

      // Calculate stats for overview
      if (activeTab === 'overview') {
        setStats({
          totalUsers: users.length,
          activeBookings: bookings.filter(b => b.status === 'Booked').length,
          totalSessions: sessions.length,
          staffMembers: users.filter(u => u.role?.includes('STAFF')).length
        });
      }
    } catch (err) {
      console.error('Error in loadData:', err);
    }
  };

  const handleUpdatePlan = async (planId, updates) => {
    try {
      await apiRequest(`/api/membership/plans/${planId}`, { method: 'PATCH', body: updates });
      setSuccess('Plan updated successfully');
      loadData();
    } catch (err) {
      setError(err.message || "Failed to update plan");
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
        loadData();
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
                DFC Admin
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/inventory" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium">
                Inventory
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap mb-8 bg-slate-800 rounded-lg p-1">
          {['overview', 'users', 'bookings', 'sessions', 'attendance', 'plans'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 capitalize ${activeTab === tab
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-slate-700'
                }`}
            >
              {tab === 'bookings' ? '📅 Bookings' :
                tab === 'sessions' ? '🥊 Sessions' :
                  tab === 'attendance' ? '📋 Attendance' :
                    tab === 'plans' ? '💎 Plans' :
                      tab === 'overview' ? '📊 Overview' : '👥 Users'}
            </button>
          ))}
        </div>

        {/* Messages */}
        {error && <div className="bg-red-600 text-white p-4 rounded-lg mb-6">{error}</div>}
        {success && <div className="bg-green-600 text-white p-4 rounded-lg mb-6">{success}</div>}

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Admin Overview</h1>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center border border-slate-700">
                  <div className="text-3xl font-bold text-green-400 mb-2">{users.length}</div>
                  <p className="text-gray-300">Total Users</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center border border-slate-700">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{bookings.filter(b => b.status === "Booked").length}</div>
                  <p className="text-gray-300">Active Bookings</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center border border-slate-700">
                  <div className="text-3xl font-bold text-purple-400 mb-2">{sessions.length}</div>
                  <p className="text-gray-300">Total Sessions</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center border border-slate-700">
                  <div className="text-3xl font-bold text-orange-400 mb-2">{users.filter(u => u.role?.includes("STAFF")).length}</div>
                  <p className="text-gray-300">Staff Members</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                  <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map(booking => (
                      <div key={booking._id} className="bg-slate-700 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="text-white font-semibold">{booking.memberId?.name || 'Unknown'}</p>
                          <p className="text-gray-400 text-sm">{booking.sessionType}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">{booking.status}</span>
                      </div>
                    ))}
                    {bookings.length === 0 && <p className="text-gray-500 italic">No recent bookings</p>}
                  </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                  <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Total Members:</span>
                      <span className="text-white font-bold">{users.filter(u => u.role?.includes("MEMBER")).length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Active Sessions Today:</span>
                      <span className="text-white font-bold">{sessions.filter(s => s.status === "Active").length}</span>
                    </div>
                  </div>
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
                          await apiRequest(`/api/bookings/${b._id}`, { method: 'DELETE' });
                          loadData();
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




          // ... inside the main component render ...
          // ...
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
// ...
        </div>
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>&copy; 2026 Dharan Fitness Club. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;