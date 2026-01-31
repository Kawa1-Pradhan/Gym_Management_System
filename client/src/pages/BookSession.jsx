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

      await apiRequest(endpoint, {
        method: 'POST'
      });

      setSuccess(`${sessionType} session booked successfully!`);
      await loadActiveSessions();
      await loadMyBookings();

      // Clear success message after 3 seconds
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
      await apiRequest(`/api/bookings/${bookingId}`, {
        method: 'DELETE'
      });

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
      <div className="bg-slate-700 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{session.name}</h3>
            {sessionType === 'Boxing' && (
              <p className="text-gray-300 text-sm">
                <span className="font-medium">Instructor:</span> {session.instructor}
              </p>
            )}
            {sessionType === 'Sauna' && session.temperature && (
              <p className="text-gray-300 text-sm">
                <span className="font-medium">Temperature:</span> {session.temperature}°C
              </p>
            )}
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${isFull ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
              }`}>
              {session.availableSlots} / {session.maxCapacity} slots
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-gray-300 text-sm">
            <span className="font-medium">📅 Date:</span> {formatDate(session.date)}
          </p>
          <p className="text-gray-300 text-sm">
            <span className="font-medium">🕐 Time:</span> {session.startTime} - {session.endTime}
          </p>
          {session.description && (
            <p className="text-gray-400 text-sm mt-2">{session.description}</p>
          )}
        </div>

        {isBooked ? (
          <div className="bg-blue-900 text-blue-200 px-4 py-2 rounded-md text-center font-medium">
            ✓ Already Booked
          </div>
        ) : (
          <button
            onClick={() => handleBookSession(session._id, sessionType)}
            disabled={isFull || loading}
            className={`w-full py-2 px-4 rounded-md font-semibold transition duration-300 ${isFull
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
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
        <div className="text-center py-8 text-gray-400">
          <p>No active bookings. Book a session above to get started!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {activeBookings.map(booking => (
          <div key={booking._id} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {booking.sessionType === 'Boxing' ? '🥊' : '🏊‍♂️'}
                </span>
                <h4 className="text-white font-semibold">
                  {booking.sessionDetails?.name || `${booking.sessionType} Session`}
                </h4>
              </div>

              {booking.sessionDetails && (
                <div className="text-sm text-gray-300 space-y-1">
                  <p>
                    📅 {formatDate(booking.sessionDetails.date)} •
                    🕐 {booking.sessionDetails.startTime} - {booking.sessionDetails.endTime}
                  </p>
                  {booking.sessionType === 'Boxing' && booking.sessionDetails.instructor && (
                    <p>👤 Instructor: {booking.sessionDetails.instructor}</p>
                  )}
                  {booking.sessionType === 'Sauna' && booking.sessionDetails.temperature && (
                    <p>🌡️ Temperature: {booking.sessionDetails.temperature}°C</p>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                Booked on: {formatDate(booking.bookingDate)}
              </p>
            </div>

            <button
              onClick={() => handleCancelBooking(booking._id)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-300"
            >
              Cancel
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="bg-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="text-2xl font-bold text-green-400 hover:text-green-300 transition duration-300"
              >
                ← Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-gray-300">Book a Session</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Messages */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6 shadow-lg">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6 shadow-lg">
            ✓ {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex mb-8 bg-slate-800 rounded-lg p-1">
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
          <button
            onClick={() => setActiveTab('mybookings')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition duration-300 ${activeTab === 'mybookings'
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-slate-700'
              }`}
          >
            📋 My Bookings ({myBookings.filter(b => b.status === 'Booked').length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'boxing' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Available Boxing Sessions</h2>
            {boxingSessions.length === 0 ? (
              <div className="bg-slate-800 p-8 rounded-lg text-center text-gray-400">
                <p>No active boxing sessions available at the moment.</p>
                <p className="text-sm mt-2">Check back later for new sessions!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boxingSessions.map(session => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    sessionType="Boxing"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sauna' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Available Sauna Sessions</h2>
            {saunaSessions.length === 0 ? (
              <div className="bg-slate-800 p-8 rounded-lg text-center text-gray-400">
                <p>No active sauna sessions available at the moment.</p>
                <p className="text-sm mt-2">Check back later for new sessions!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {saunaSessions.map(session => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    sessionType="Sauna"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'mybookings' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">My Bookings</h2>
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
              <MyBookingsSection />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookSession;