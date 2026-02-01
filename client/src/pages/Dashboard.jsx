import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isStaff = user.role && user.role.includes('STAFF');

  useEffect(() => {
    loadMyBookings();
  }, []);

  const loadMyBookings = async () => {
    try {
      const response = await apiRequest('/api/bookings/my-bookings');
      setBookings(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error loading bookings:', err);
      // Don't show error for new users with no bookings
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await apiRequest(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      setSuccess('Booking cancelled successfully');
      loadMyBookings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
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
              <span className="text-gray-300">Welcome, {user.name || 'Member'}!</span>
              {isStaff && (
                <Link
                  to="/staff-dashboard"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition duration-300"
                >
                  Staff Dashboard
                </Link>
              )}
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

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Messages */}
        {error && (
          <div className="bg-red-600/20 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-600/20 border border-green-500 text-green-500 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to Your Dashboard</h1>
          <p className="text-xl text-gray-300">Manage your gym membership and track your progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center border border-slate-700">
            <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-green-400 mb-2">Active</h3>
            <p className="text-gray-300">Membership Status</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center border border-slate-700">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-blue-400 mb-2">Premium</h3>
            <p className="text-gray-300">Current Plan</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-center border border-slate-700">
            <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-purple-400 mb-2">{bookings.length}</h3>
            <p className="text-gray-300">Booked Sessions</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 p-8 rounded-lg shadow-lg mb-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-green-600 hover:bg-green-700 p-4 rounded-lg text-white font-semibold transition duration-300">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
              Renew Membership
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg text-white font-semibold transition duration-300">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Profile
            </button>
            <Link to="/book-session" className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg text-white font-semibold transition duration-300 block text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Book Session
            </Link>
            <button className="bg-orange-600 hover:bg-orange-700 p-4 rounded-lg text-white font-semibold transition duration-300">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Contact Support
            </button>
          </div>
        </div>

        {/* My Active Bookings Section */}
        {bookings.length > 0 && (
          <div className="bg-slate-800 p-8 rounded-lg shadow-lg mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              📅 My Schedule
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {bookings.map(booking => (
                <div key={booking._id} className="bg-slate-700 p-5 rounded-lg border border-slate-600 hover:border-slate-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${booking.sessionType === 'Boxing' ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'}`}>
                        {booking.sessionType}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">
                        {booking.sessionDetails?.name || 'Session Info Unavailable'}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="Cancel Booking"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-2 text-sm text-gray-300">
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {booking.sessionDetails?.date ? new Date(booking.sessionDetails.date).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {booking.sessionDetails?.startTime || 'N/A'} - {booking.sessionDetails?.endTime || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-slate-700 rounded-lg">
              <div className="bg-green-600 p-2 rounded-full mr-4">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Membership Renewed</p>
                <p className="text-gray-400 text-sm">Successfully renewed your premium membership</p>
              </div>
              <span className="ml-auto text-gray-400 text-sm">2 days ago</span>
            </div>

            <div className="flex items-center p-4 bg-slate-700 rounded-lg">
              <div className="bg-purple-600 p-2 rounded-full mr-4">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Group Class Attended</p>
                <p className="text-gray-400 text-sm">Participated in Yoga Flow class</p>
              </div>
              <span className="ml-auto text-gray-400 text-sm">2 weeks ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
