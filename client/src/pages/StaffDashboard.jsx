import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const StaffDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [boxingSessions, setBoxingSessions] = useState([]);
  const [saunaSessions, setSaunaSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Form states
  const [boxingForm, setBoxingForm] = useState({
    name: '',
    instructor: '',
    date: '',
    startTime: '',
    endTime: '',
    maxCapacity: '',
    description: ''
  });

  const [saunaForm, setSaunaForm] = useState({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    maxCapacity: '',
    temperature: '85',
    description: ''
  });

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    memberId: '',
    sessionId: '',
    sessionType: 'boxing' // 'boxing' or 'sauna'
  });

  const [editingSession, setEditingSession] = useState(null);

  useEffect(() => {
    checkStaffAccess();
    if (activeTab === 'boxing' || activeTab === 'home') {
      loadBoxingSessions();
    }
    if (activeTab === 'sauna' || activeTab === 'home') {
      loadSaunaSessions();
    }
    if (activeTab === 'bookings') {
      loadMembers();
      loadBoxingSessions();
      loadSaunaSessions();
    }
  }, [activeTab]);

  const checkStaffAccess = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token || !userData.role || !userData.role.includes('STAFF')) {
      navigate('/dashboard');
      return;
    }

    setUser(userData);
  };

  const loadBoxingSessions = async () => {
    try {
      const response = await apiRequest('/api/sessions/boxing');
      setBoxingSessions(response);
    } catch (err) {
      console.error('Error loading boxing sessions:', err);
    }
  };

  const loadSaunaSessions = async () => {
    try {
      const response = await apiRequest('/api/sessions/sauna');
      setSaunaSessions(response);
    } catch (err) {
      console.error('Error loading sauna sessions:', err);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await apiRequest('/api/users');
      // Filter only members
      const memberUsers = response.filter(u => u.role && u.role.includes('MEMBER'));
      setMembers(memberUsers);
    } catch (err) {
      console.error('Error loading members:', err);
      setError('Failed to load members');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = bookingForm.sessionType === 'boxing'
        ? '/api/bookings/boxing'
        : '/api/bookings/sauna';

      await apiRequest(endpoint, {
        method: 'POST',
        body: {
          sessionId: bookingForm.sessionId,
          memberId: bookingForm.memberId
        }
      });

      setSuccess(`${bookingForm.sessionType === 'boxing' ? 'Boxing' : 'Sauna'} session booked successfully for member!`);
      setBookingForm({
        memberId: '',
        sessionId: '',
        sessionType: 'boxing'
      });
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

      setBoxingForm({
        name: '',
        instructor: '',
        date: '',
        startTime: '',
        endTime: '',
        maxCapacity: '',
        description: ''
      });
      setEditingSession(null);
      loadBoxingSessions();
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

      setSaunaForm({
        name: '',
        date: '',
        startTime: '',
        endTime: '',
        maxCapacity: '',
        temperature: '85',
        description: ''
      });
      setEditingSession(null);
      loadSaunaSessions();
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
      await apiRequest(`/api/sessions/${type}/${sessionId}/cancel`, {
        method: 'PATCH'
      });
      setSuccess('Session cancelled successfully!');
      if (type === 'boxing') loadBoxingSessions();
      else loadSaunaSessions();
    } catch (err) {
      setError(err.message || 'Failed to cancel session');
    }
  };

  const handleDelete = async (sessionId, type) => {
    if (!confirm('Are you sure you want to permanently delete this session?')) return;

    try {
      await apiRequest(`/api/sessions/${type}/${sessionId}`, {
        method: 'DELETE'
      });
      setSuccess('Session deleted successfully!');
      if (type === 'boxing') loadBoxingSessions();
      else loadSaunaSessions();
    } catch (err) {
      setError(err.message || 'Failed to delete session');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-green-400 bg-green-900';
      case 'Cancelled': return 'text-red-400 bg-red-900';
      case 'Completed': return 'text-blue-400 bg-blue-900';
      default: return 'text-gray-400 bg-gray-700';
    }
  };

  const upcomingSessions = [...boxingSessions, ...saunaSessions]
    .filter(session => session.status === 'Active')
    .filter(session => new Date(session.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  if (!user) return null;

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
              <span className="text-gray-300">Staff: {user.name}</span>
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
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 ${activeTab === 'home'
              ? 'bg-red-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
          >
            🏠 Dashboard Home
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 ${activeTab === 'bookings'
              ? 'bg-red-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
          >
            📅 Book for Member
          </button>
          <button
            onClick={() => setActiveTab('boxing')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 ${activeTab === 'boxing'
              ? 'bg-red-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
          >
            🥊 Boxing Sessions
          </button>
          <button
            onClick={() => setActiveTab('sauna')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 ${activeTab === 'sauna'
              ? 'bg-red-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
          >
            🏊‍♂️ Sauna Sessions
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

        {/* Dashboard Home */}
        {activeTab === 'home' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Staff Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{boxingSessions.length}</div>
                <p className="text-gray-300">Boxing Sessions</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{saunaSessions.length}</div>
                <p className="text-gray-300">Sauna Sessions</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">{upcomingSessions.length}</div>
                <p className="text-gray-300">Upcoming Sessions</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {boxingSessions.filter(s => s.status === 'Active').length + saunaSessions.filter(s => s.status === 'Active').length}
                </div>
                <p className="text-gray-300">Active Sessions</p>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-6">Upcoming Sessions</h2>
              <div className="space-y-4">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map(session => (
                    <div key={session._id} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-semibold">{session.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {new Date(session.date).toLocaleDateString()} • {session.startTime}-{session.endTime}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {session.instructor || `Temperature: ${session.temperature}°C`} • Capacity: {session.availableSlots}/{session.maxCapacity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">No upcoming sessions scheduled</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Book for Member Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Book Session for Member</h1>

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6">Create Booking</h2>
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Member</label>
                    <select
                      value={bookingForm.memberId}
                      onChange={(e) => setBookingForm({ ...bookingForm, memberId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="">-- Select a Member --</option>
                      {members.map(member => (
                        <option key={member._id} value={member._id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Session Type</label>
                    <select
                      value={bookingForm.sessionType}
                      onChange={(e) => setBookingForm({ ...bookingForm, sessionType: e.target.value, sessionId: '' })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="boxing">Boxing Session</option>
                      <option value="sauna">Sauna Session</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Session</label>
                  <select
                    value={bookingForm.sessionId}
                    onChange={(e) => setBookingForm({ ...bookingForm, sessionId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="">-- Select a Session --</option>
                    {(bookingForm.sessionType === 'boxing' ? boxingSessions : saunaSessions)
                      .filter(s => s.status === 'Active' && s.availableSlots > 0)
                      .map(session => (
                        <option key={session._id} value={session._id}>
                          {session.name} - {new Date(session.date).toLocaleDateString()} {session.startTime}-{session.endTime}
                          ({session.availableSlots}/{session.maxCapacity} slots)
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-md transition duration-300"
                >
                  {loading ? 'Booking...' : 'Book Session for Member'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Boxing Sessions Management */}
        {activeTab === 'boxing' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">Boxing Sessions Management</h1>
              <button
                onClick={() => {
                  setEditingSession(null);
                  setBoxingForm({
                    name: '',
                    instructor: '',
                    date: '',
                    startTime: '',
                    endTime: '',
                    maxCapacity: '',
                    description: ''
                  });
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-semibold transition duration-300"
              >
                Add New Session
              </button>
            </div>

            {/* Add/Edit Form */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
              <h2 className="text-xl font-bold text-white mb-6">
                {editingSession ? 'Edit Boxing Session' : 'Add New Boxing Session'}
              </h2>
              <form onSubmit={handleBoxingSubmit} className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Session Name</label>
                  <input
                    type="text"
                    value={boxingForm.name}
                    onChange={(e) => setBoxingForm({ ...boxingForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Instructor</label>
                  <input
                    type="text"
                    value={boxingForm.instructor}
                    onChange={(e) => setBoxingForm({ ...boxingForm, instructor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={boxingForm.date}
                    onChange={(e) => setBoxingForm({ ...boxingForm, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Capacity</label>
                  <input
                    type="number"
                    value={boxingForm.maxCapacity}
                    onChange={(e) => setBoxingForm({ ...boxingForm, maxCapacity: e.target.value })}
                    min="1"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={boxingForm.startTime}
                    onChange={(e) => setBoxingForm({ ...boxingForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                  <input
                    type="time"
                    value={boxingForm.endTime}
                    onChange={(e) => setBoxingForm({ ...boxingForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={boxingForm.description}
                    onChange={(e) => setBoxingForm({ ...boxingForm, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-md transition duration-300"
                  >
                    {loading ? 'Saving...' : (editingSession ? 'Update Session' : 'Create Session')}
                  </button>
                </div>
              </form>
            </div>

            {/* Sessions List */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6">All Boxing Sessions</h2>
              <div className="space-y-4">
                {boxingSessions.map(session => (
                  <div key={session._id} className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{session.name}</h3>
                        <p className="text-gray-400">Instructor: {session.instructor}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(session.date).toLocaleDateString()} • {session.startTime}-{session.endTime}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Capacity: {session.availableSlots}/{session.maxCapacity} • Created by: {session.createdBy?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(session, 'boxing')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition duration-300"
                          >
                            Edit
                          </button>
                          {session.status === 'Active' && (
                            <button
                              onClick={() => handleCancel(session._id, 'boxing')}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition duration-300"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(session._id, 'boxing')}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition duration-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    {session.description && (
                      <p className="text-gray-300 text-sm">{session.description}</p>
                    )}

                    {/* Booked Members Section */}
                    {session.bookings && session.bookings.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-600">
                        <details className="group">
                          <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-medium text-gray-300 hover:text-white">
                            <span>👥 Booked Members ({session.bookings.length})</span>
                            <span className="transition group-open:rotate-180">
                              ▼
                            </span>
                          </summary>
                          <div className="mt-3 space-y-2">
                            {session.bookings.map((member, idx) => (
                              <div key={member._id || idx} className="bg-slate-600 p-3 rounded flex justify-between items-center">
                                <div>
                                  <p className="text-white font-medium">{member.name}</p>
                                  <p className="text-gray-400 text-xs">{member.email}</p>
                                </div>
                                <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                                  Booked
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
                {boxingSessions.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No boxing sessions found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sauna Sessions Management */}
        {activeTab === 'sauna' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">Sauna Sessions Management</h1>
              <button
                onClick={() => {
                  setEditingSession(null);
                  setSaunaForm({
                    name: '',
                    date: '',
                    startTime: '',
                    endTime: '',
                    maxCapacity: '',
                    temperature: '85',
                    description: ''
                  });
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-semibold transition duration-300"
              >
                Add New Session
              </button>
            </div>

            {/* Add/Edit Form */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
              <h2 className="text-xl font-bold text-white mb-6">
                {editingSession ? 'Edit Sauna Session' : 'Add New Sauna Session'}
              </h2>
              <form onSubmit={handleSaunaSubmit} className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Session Name</label>
                  <input
                    type="text"
                    value={saunaForm.name}
                    onChange={(e) => setSaunaForm({ ...saunaForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Temperature (°C)</label>
                  <input
                    type="number"
                    value={saunaForm.temperature}
                    onChange={(e) => setSaunaForm({ ...saunaForm, temperature: e.target.value })}
                    min="60"
                    max="100"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={saunaForm.date}
                    onChange={(e) => setSaunaForm({ ...saunaForm, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Capacity</label>
                  <input
                    type="number"
                    value={saunaForm.maxCapacity}
                    onChange={(e) => setSaunaForm({ ...saunaForm, maxCapacity: e.target.value })}
                    min="1"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={saunaForm.startTime}
                    onChange={(e) => setSaunaForm({ ...saunaForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                  <input
                    type="time"
                    value={saunaForm.endTime}
                    onChange={(e) => setSaunaForm({ ...saunaForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={saunaForm.description}
                    onChange={(e) => setSaunaForm({ ...saunaForm, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-md transition duration-300"
                  >
                    {loading ? 'Saving...' : (editingSession ? 'Update Session' : 'Create Session')}
                  </button>
                </div>
              </form>
            </div>

            {/* Sessions List */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6">All Sauna Sessions</h2>
              <div className="space-y-4">
                {saunaSessions.map(session => (
                  <div key={session._id} className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{session.name}</h3>
                        <p className="text-gray-400">Temperature: {session.temperature}°C</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(session.date).toLocaleDateString()} • {session.startTime}-{session.endTime}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Capacity: {session.availableSlots}/{session.maxCapacity} • Created by: {session.createdBy?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(session, 'sauna')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition duration-300"
                          >
                            Edit
                          </button>
                          {session.status === 'Active' && (
                            <button
                              onClick={() => handleCancel(session._id, 'sauna')}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition duration-300"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(session._id, 'sauna')}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition duration-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    {session.description && (
                      <p className="text-gray-300 text-sm">{session.description}</p>
                    )}

                    {/* Booked Members Section */}
                    {session.bookings && session.bookings.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-600">
                        <details className="group">
                          <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-medium text-gray-300 hover:text-white">
                            <span>👥 Booked Members ({session.bookings.length})</span>
                            <span className="transition group-open:rotate-180">
                              ▼
                            </span>
                          </summary>
                          <div className="mt-3 space-y-2">
                            {session.bookings.map((member, idx) => (
                              <div key={member._id || idx} className="bg-slate-600 p-3 rounded flex justify-between items-center">
                                <div>
                                  <p className="text-white font-medium">{member.name}</p>
                                  <p className="text-gray-400 text-xs">{member.email}</p>
                                </div>
                                <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                                  Booked
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
                {saunaSessions.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No sauna sessions found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;