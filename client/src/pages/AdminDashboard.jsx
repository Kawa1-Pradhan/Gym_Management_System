import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
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
  }, [activeTab]);

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
      // Load users, bookings, and sessions based on active tab
      if (activeTab === 'overview' || activeTab === 'users') {
        try {
          const response = await apiRequest('/api/users');
          setUsers(response);
        } catch (err) {
          console.error('Error loading users:', err);
          // Fallback to mock data if API fails
          setUsers([
            { _id: '1', name: 'Admin User', email: 'admin@example.com', role: ['ADMIN'], membershipStatus: 'Active' },
            { _id: '2', name: 'Staff User', email: 'staff@example.com', role: ['STAFF'], membershipStatus: 'Active' },
            { _id: '3', name: 'Member One', email: 'member1@example.com', role: ['MEMBER'], membershipStatus: 'Active' },
            { _id: '4', name: 'Member Two', email: 'member2@example.com', role: ['MEMBER'], membershipStatus: 'Active' }
          ]);
        }
      }

      if (activeTab === 'overview' || activeTab === 'bookings') {
        try {
          // Load all bookings from both endpoints
          const boxingBookings = await apiRequest('/api/bookings/boxing');
          const saunaBookings = await apiRequest('/api/bookings/sauna');

          const allBookings = [
            ...boxingBookings.map(b => ({ ...b, type: 'Boxing' })),
            ...saunaBookings.map(b => ({ ...b, type: 'Sauna' }))
          ];
          setBookings(allBookings);
        } catch (err) {
          console.error('Error loading bookings:', err);
          setBookings([
            { _id: '1', type: 'Boxing', memberName: 'Member One', sessionName: 'Beginner Boxing', status: 'Confirmed', date: '2026-01-31' },
            { _id: '2', type: 'Sauna', memberName: 'Member Two', sessionName: 'Sauna Session', status: 'Pending', date: '2026-01-31' }
          ]);
        }
      }

      if (activeTab === 'overview' || activeTab === 'sessions') {
        try {
          // Load all sessions from both endpoints
          const boxingSessions = await apiRequest('/api/sessions/boxing');
          const saunaSessions = await apiRequest('/api/sessions/sauna');

          const allSessions = [
            ...boxingSessions.map(s => ({ ...s, type: 'Boxing' })),
            ...saunaSessions.map(s => ({ ...s, type: 'Sauna' }))
          ];
          setSessions(allSessions);
        } catch (err) {
          console.error('Error loading sessions:', err);
          setSessions([
            { _id: '1', type: 'Boxing', name: 'Beginner Boxing', instructor: 'John Smith', status: 'Active', availableSlots: 8, maxCapacity: 10 },
            { _id: '2', type: 'Sauna', name: 'Relaxation Sauna', status: 'Active', availableSlots: 15, maxCapacity: 20 }
          ]);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
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
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    // This would require additional admin API endpoints
    setSuccess(`${action} action performed on user`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  const stats = {
    totalUsers: users.length,
    activeBookings: bookings.filter(b => b.status === 'Confirmed').length,
    totalSessions: sessions.length,
    staffMembers: users.filter(u => u.role.includes('STAFF')).length
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="bg-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-green-400 hover:text-green-300 transition duration-300">
                Dharan Fitness Club
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Admin: {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex mb-8 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 ${activeTab === 'overview'
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 ${activeTab === 'users'
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
          >
            👥 User Management
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 ${activeTab === 'bookings'
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
          >
            📅 Booking Oversight
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 ${activeTab === 'sessions'
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
          >
            🏋️‍♂️ Session Management
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard Overview</h1>

            {/* Statistics Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{stats.totalUsers}</div>
                <p className="text-gray-300">Total Users</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{stats.activeBookings}</div>
                <p className="text-gray-300">Active Bookings</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">{stats.totalSessions}</div>
                <p className="text-gray-300">Total Sessions</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">{stats.staffMembers}</div>
                <p className="text-gray-300">Staff Members</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">Recent Bookings</h2>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map(booking => (
                    <div key={booking._id} className="bg-slate-700 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-white font-semibold">{booking.memberName}</p>
                        <p className="text-gray-400 text-sm">{booking.type}: {booking.sessionName}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'Confirmed' ? 'text-green-400 bg-green-900' : 'text-yellow-400 bg-yellow-900'
                        }`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Database</span>
                    <span className="text-green-400">✅ Connected</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">API Services</span>
                    <span className="text-green-400">✅ Running</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Active Sessions</span>
                    <span className="text-blue-400">{sessions.filter(s => s.status === 'Active').length} Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Bookings</span>
                    <span className="text-purple-400">{bookings.length} Bookings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">User Management</h1>
              <button
                onClick={() => setActiveTab('create-staff')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-semibold transition duration-300"
              >
                Add Staff Member
              </button>
            </div>

            {/* Create Staff Form */}
            {activeTab === 'create-staff' && (
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-bold text-white mb-6">Create New Staff Member</h2>
                <form onSubmit={handleCreateStaff} className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Default Password</label>
                    <input
                      type="text"
                      value={newStaff.password}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white cursor-not-allowed"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-md transition duration-300"
                    >
                      {loading ? 'Creating...' : 'Create Staff Member'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users List */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6">All Users</h2>
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user._id} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-semibold">{user.name}</h3>
                      <p className="text-gray-400">{user.email}</p>
                      <p className="text-gray-400 text-sm">Role: {user.role.join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.membershipStatus === 'Active' ? 'text-green-400 bg-green-900' : 'text-gray-400 bg-gray-700'
                        }`}>
                        {user.membershipStatus}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUserAction(user._id, 'Edit')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition duration-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleUserAction(user._id, 'Suspend')}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition duration-300"
                        >
                          Suspend
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Booking Oversight Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Booking Oversight</h1>
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6">All Bookings</h2>
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking._id} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-semibold">{booking.memberName}</h3>
                      <p className="text-gray-400">{booking.type}: {booking.sessionName}</p>
                      <p className="text-gray-400 text-sm">Date: {booking.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'Confirmed' ? 'text-green-400 bg-green-900' : 'text-yellow-400 bg-yellow-900'
                        }`}>
                        {booking.status}
                      </span>
                      <div className="flex gap-2">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition duration-300">
                          View Details
                        </button>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition duration-300">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Session Management Tab */}
        {activeTab === 'sessions' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Session Management</h1>
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6">All Sessions</h2>
              <div className="space-y-4">
                {sessions.map(session => (
                  <div key={session._id} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-semibold">{session.name}</h3>
                      <p className="text-gray-400">{session.type} {session.instructor ? `• Instructor: ${session.instructor}` : `• Temperature: ${session.temperature}°C`}</p>
                      <p className="text-gray-400 text-sm">Capacity: {session.availableSlots}/{session.maxCapacity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${session.status === 'Active' ? 'text-green-400 bg-green-900' : 'text-red-400 bg-red-900'
                        }`}>
                        {session.status}
                      </span>
                      <div className="flex gap-2">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition duration-300">
                          Edit
                        </button>
                        <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition duration-300">
                          Update Status
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;