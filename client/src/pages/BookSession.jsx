import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const BookSession = () => {
  const [activeTab, setActiveTab] = useState('boxing');
  const [boxingSessions, setBoxingSessions] = useState([]);
  const [saunaSessions, setSaunaSessions] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadActiveSessions();
    loadMyBookings();
  }, []);

  const loadActiveSessions = async () => {
    try {
      const [boxingRes, saunaRes] = await Promise.all([
        apiRequest('/api/bookings/sessions/boxing/active'),
        apiRequest('/api/bookings/sessions/sauna/active')
      ]);
      setBoxingSessions(boxingRes);
      setSaunaSessions(saunaRes);
    } catch (err) {
      console.error('Error loading active sessions:', err);
      setError('Failed to load sessions');
    }
  };

  const loadMyBookings = async () => {
    try {
      const bookings = await apiRequest('/api/bookings/my-bookings');
      setMyBookings(bookings);
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  const isSessionBooked = (sessionId, sessionType) => {
    return myBookings.some(
      booking => booking.sessionId === sessionId &&
        booking.sessionType === sessionType &&
        booking.status === 'Booked'
    );
  };

  const handleBookSession = async (sessionId, sessionType) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = sessionType === 'Boxing'
        ? `/api/bookings/boxing/${sessionId}`
        : `/api/bookings/sauna/${sessionId}`;

      await apiRequest(endpoint, { method: 'POST' });

      setSuccess(`${sessionType} session booked successfully!`);
      await loadActiveSessions();
      await loadMyBookings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || `Failed to book ${sessionType.toLowerCase()} session`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await apiRequest(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      setSuccess('Booking cancelled successfully!');
      await loadActiveSessions();
      await loadMyBookings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const SessionCard = ({ session, sessionType }) => {
    const isBooked = isSessionBooked(session._id, sessionType);
    const isFull = session.availableSlots === 0;

    return (
      <div className="bg-neutral-900 border border-neutral-800 hover:border-red-500/30 p-6 rounded-xl shadow-lg transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="text-lg font-bold text-white mb-1 truncate">{session.name}</h3>
              {sessionType === 'Boxing' && session.instructor && (
                <p className="text-neutral-400 text-xs font-medium">
                  <span className="text-neutral-500">Instructor:</span> {session.instructor}
                </p>
              )}
              {sessionType === 'Sauna' && session.temperature && (
                <p className="text-neutral-400 text-xs font-medium">
                  <span className="text-neutral-500">Temperature:</span> {session.temperature}°C
                </p>
              )}
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex-shrink-0 ${isFull
                ? 'bg-red-900/20 text-red-400 border-red-500/20'
                : 'bg-green-900/20 text-green-400 border-green-500/20'
              }`}>
              {session.availableSlots}/{session.maxCapacity}
            </div>
          </div>

          <div className="space-y-2 mb-5 border-t border-neutral-800 pt-4">
            <div className="flex items-center gap-2 text-neutral-400 text-xs">
              <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(session.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 text-xs">
              <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{session.startTime} – {session.endTime}</span>
            </div>
            {session.description && (
              <p className="text-neutral-600 text-xs mt-1 italic">{session.description}</p>
            )}
          </div>
        </div>

        {isBooked ? (
          <div className="flex items-center justify-center gap-2 bg-green-900/20 border border-green-500/20 text-green-400 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Already Booked
          </div>
        ) : (
          <button
            onClick={() => handleBookSession(session._id, sessionType)}
            disabled={isFull || loading}
            className={`w-full py-2.5 px-4 rounded-lg font-bold text-sm transition-all uppercase tracking-wide ${isFull
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
              }`}
          >
            {isFull ? 'Session Full' : loading ? 'Booking...' : 'Book Now'}
          </button>
        )}
      </div>
    );
  };

  const MyBookingsSection = () => {
    const activeBookings = myBookings.filter(b => b.status === 'Booked');

    if (activeBookings.length === 0) {
      return (
        <div className="text-center py-12 text-neutral-500 italic">
          <svg className="w-12 h-12 mx-auto mb-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No active bookings yet.</p>
          <p className="text-sm mt-1">Book a session above to get started!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {activeBookings.map(booking => (
          <div key={booking._id} className="bg-black/40 border border-neutral-800 hover:border-red-500/20 p-5 rounded-xl flex flex-wrap justify-between items-center gap-4 transition-all">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-base">{booking.sessionType === 'Boxing' ? '🥊' : '🧖'}</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">
                    {booking.sessionDetails?.name || `${booking.sessionType} Session`}
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500">{booking.sessionType}</span>
                </div>
              </div>

              {booking.sessionDetails && (
                <div className="text-xs text-neutral-500 space-y-1 ml-12">
                  <p className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {formatDate(booking.sessionDetails.date)} · {booking.sessionDetails.startTime} – {booking.sessionDetails.endTime}
                  </p>
                  {booking.sessionType === 'Boxing' && booking.sessionDetails.instructor && (
                    <p className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {booking.sessionDetails.instructor}
                    </p>
                  )}
                  {booking.sessionType === 'Sauna' && booking.sessionDetails.temperature && (
                    <p className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                      {booking.sessionDetails.temperature}°C
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => handleCancelBooking(booking._id)}
              className="bg-neutral-800 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-neutral-700 hover:border-red-500/30 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
          </div>
        ))}
      </div>
    );
  };

  const TABS = [
    { id: 'boxing', label: 'Boxing Sessions', icon: '🥊' },
    { id: 'sauna', label: 'Sauna Sessions', icon: '🧖' },
    { id: 'mybookings', label: `My Bookings (${myBookings.filter(b => b.status === 'Booked').length})`, icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation Bar */}
      <header className="bg-black/80 backdrop-blur-md border-b border-neutral-900 sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-white font-bold text-lg tracking-tight">
            DFC<span className="text-red-600">.</span>
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-black text-white">Book a Session</h1>
          <p className="text-neutral-500 text-sm mt-1">Browse and reserve available sessions at Dharan Fitness Club.</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-medium">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/30 border border-green-500/30 text-green-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-medium">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1 mb-8 gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-neutral-500 hover:text-white hover:bg-neutral-800'
                }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Boxing Tab */}
        {activeTab === 'boxing' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white mb-6">Available Boxing Sessions</h2>
            {boxingSessions.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 p-12 rounded-xl text-center text-neutral-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">No boxing sessions available right now.</p>
                <p className="text-sm mt-1">Check back later for new sessions!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {boxingSessions.map(session => (
                  <SessionCard key={session._id} session={session} sessionType="Boxing" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sauna Tab */}
        {activeTab === 'sauna' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white mb-6">Available Sauna Sessions</h2>
            {saunaSessions.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 p-12 rounded-xl text-center text-neutral-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">No sauna sessions available right now.</p>
                <p className="text-sm mt-1">Check back later for new sessions!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {saunaSessions.map(session => (
                  <SessionCard key={session._id} session={session} sessionType="Sauna" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'mybookings' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white mb-6">My Bookings</h2>
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-xl">
              <MyBookingsSection />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookSession;