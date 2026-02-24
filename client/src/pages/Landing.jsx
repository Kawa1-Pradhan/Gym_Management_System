import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const Landing = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [guestDetails, setGuestDetails] = useState({ name: '', email: '', phone: '' });
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalMembers: 0,
    membershipsSold: 0,
    monthlyBookings: 0,
    attendanceRate: 0,
    popularSession: null
  });

  useEffect(() => {
    fetchPlans();
    fetchAnalytics();
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(storedUser);

    // Handle hash scrolling for #pricing
    if (window.location.hash === '#pricing') {
      scrollToSection('pricing');
    }
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80, // Offset for fixed nav
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  const fetchAnalytics = async () => {
    try {
      const data = await apiRequest('/api/reports/public-analytics');
      if (data) setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/membership/plans');
      console.log(`Fetched ${response?.length || 0} plans from API`);

      if (Array.isArray(response)) {
        setPlans(response);
      } else {
        console.error("API returned non-array for plans:", response);
        setPlans([]); // Default to empty array to prevent map crashes
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = (plan) => {
    setSelectedPlan(plan);
    // Default to the first category if available
    if (plan.categories && plan.categories.length > 0) {
      setSelectedCategory(plan.categories[0].name);
    }

    if (user && user.email) {
      setGuestDetails({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    } else {
      setGuestDetails({ name: '', email: '', phone: '' });
    }
    setShowModal(true);
  };

  const handleProceedPayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const res = await apiRequest('/api/membership/purchase', {
        method: 'POST',
        body: {
          planId: selectedPlan._id,
          categoryName: selectedCategory,
          ...guestDetails
        }
      });

      if (res.payment_url) {
        window.location.href = res.payment_url;
      }
    } catch (err) {
      alert("Payment Error: " + (err.response?.data?.message || err.message));
      setProcessing(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to={user ? (user.role?.includes('ADMIN') ? '/admin-dashboard' : (user.role?.includes('STAFF') ? '/staff-dashboard' : '/dashboard')) : '/'} className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                Dharan Fitness Club
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('home')}
                className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition duration-300"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition duration-300"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition duration-300"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition duration-300"
              >
                About
              </button>
              <Link
                to={user ? (user.role?.includes('ADMIN') ? '/admin-dashboard' : (user.role?.includes('STAFF') ? '/staff-dashboard' : '/dashboard')) : '/login'}
                className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 px-6 py-2 rounded-lg text-sm font-semibold transition duration-300 shadow-lg hover:shadow-xl"
              >
                {user ? 'Go to Dashboard' : 'Login'}
              </Link>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-300 hover:text-cyan-400 transition duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden border-t border-slate-800/50">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button
                  onClick={() => scrollToSection('home')}
                  className="block w-full text-left text-slate-300 hover:text-cyan-400 px-3 py-2 text-base font-medium transition duration-300"
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="block w-full text-left text-slate-300 hover:text-cyan-400 px-3 py-2 text-base font-medium transition duration-300"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="block w-full text-left text-slate-300 hover:text-cyan-400 px-3 py-2 text-base font-medium transition duration-300"
                >
                  Pricing
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="block w-full text-left text-slate-300 hover:text-cyan-400 px-3 py-2 text-base font-medium transition duration-300"
                >
                  About
                </button>
                <Link
                  to={user ? (user.role?.includes('ADMIN') ? '/admin-dashboard' : (user.role?.includes('STAFF') ? '/staff-dashboard' : '/dashboard')) : '/login'}
                  className="block w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 px-3 py-2 rounded-lg text-base font-semibold transition duration-300 text-center mt-3"
                >
                  {user ? 'Go to Dashboard' : 'Login'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <section id="home" className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                The Future of{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                  Gym Management
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
                Smart, automated, and efficient gym operations for Dharan Fitness Club.
                Transform your fitness experience with cutting-edge digital solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 px-8 py-4 rounded-lg text-lg font-semibold transition duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Contact to Enroll
                </button>
                <Link
                  to={user ? (user.role?.includes('ADMIN') ? '/admin-dashboard' : (user.role?.includes('STAFF') ? '/staff-dashboard' : '/dashboard')) : '/login'}
                  className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 px-8 py-4 rounded-lg text-lg font-semibold transition duration-300"
                >
                  {user ? 'Go to Dashboard' : 'Login'}
                </Link>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 md:p-8 shadow-2xl">
                <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-cyan-400">Gym Performance</h3>
                    <div className="flex gap-2">
                      <div className="px-2 py-1 rounded bg-cyan-400/10 text-cyan-400 text-xs font-bold">LIVE</div>
                    </div>
                  </div>

                  {/* Top Section - 3 Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="text-center p-3 sm:p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <div className="text-xl sm:text-2xl font-bold text-violet-400">{analytics.totalMembers}</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Total Members</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <div className="text-xl sm:text-2xl font-bold text-green-400">{analytics.attendanceRate}%</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Attendance</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-center p-3 sm:p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <div className="text-xl sm:text-2xl font-bold text-cyan-400">{analytics.membershipsSold}</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Memberships Sold</div>
                    </div>
                  </div>

                  {/* Bottom Section - 2 Detail Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-slate-700/50 rounded-xl p-5">
                      <h4 className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest">Monthly Bookings</h4>
                      <p className="text-2xl font-bold text-white">{analytics.monthlyBookings}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Total historical activity this month</p>
                    </div>

                    <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-slate-700/50 rounded-xl p-5 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-violet-400 mb-1 uppercase tracking-widest">Popular Class</h4>
                        <div className="text-sm font-semibold text-slate-200">
                          {analytics.popularSession ? analytics.popularSession.type : 'No Data'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {analytics.popularSession ? `${analytics.popularSession.count} Bookings` : 'Historical Top'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Comprehensive gym management tools designed for efficiency, automation, and seamless operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Membership Control */}
            <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/50 hover:bg-slate-800/80 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Membership Control</h3>
              <p className="text-slate-300 mb-4">Member records, renewals, and automated expiry notifications for seamless management.</p>
              <div className="flex items-center text-sm text-cyan-400">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                Automated notifications
              </div>
            </div>

            {/* Facility Bookings */}
            <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-violet-400/50 hover:bg-slate-800/80 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Facility Bookings</h3>
              <p className="text-slate-300 mb-4">Simple 3-click booking system for Sauna and Boxing facilities with real-time availability.</p>
              <div className="flex items-center text-sm text-violet-400">
                <span className="w-2 h-2 bg-violet-400 rounded-full mr-2"></span>
                Instant booking
              </div>
            </div>

            {/* Digital Attendance */}
            <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/50 hover:bg-slate-800/80 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Digital Attendance</h3>
              <p className="text-slate-300 mb-4">QR or ID-based check-in tracking for members and staff with instant validation.</p>
              <div className="flex items-center text-sm text-cyan-400">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                Touchless entry
              </div>
            </div>

            {/* Inventory Insights */}
            <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-violet-400/50 hover:bg-slate-800/80 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Inventory Insights</h3>
              <p className="text-slate-300 mb-4">Real-time equipment and supplement stock tracking with automated low-stock alerts.</p>
              <div className="flex items-center text-sm text-violet-400">
                <span className="w-2 h-2 bg-violet-400 rounded-full mr-2"></span>
                Smart alerts
              </div>
            </div>

            {/* Admin Dashboard */}
            <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/50 hover:bg-slate-800/80 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Admin Dashboard</h3>
              <p className="text-slate-300 mb-4">Role-based analytics and system overview for comprehensive gym management.</p>
              <div className="flex items-center text-sm text-cyan-400">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                Real-time metrics
              </div>
            </div>

            {/* Announcements */}
            <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-violet-400/50 hover:bg-slate-800/80 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Announcements</h3>
              <p className="text-slate-300 mb-4">Instant club-wide notifications and updates for important communications.</p>
              <div className="flex items-center text-sm text-violet-400">
                <span className="w-2 h-2 bg-violet-400 rounded-full mr-2"></span>
                Instant delivery
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Membership Plans</h2>
            <div className="w-20 h-1 bg-cyan-500 mx-auto rounded-full mb-6"></div>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Choose the perfect plan for your fitness journey. All plans provide full access to gym facilities and features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div key={plan._id} className={`flex flex-col bg-slate-900 border ${plan.highlightTag ? 'border-cyan-500/50' : 'border-slate-800'} rounded-2xl p-6 hover:border-slate-700 transition-colors duration-300`}>

                <div className="mb-6">
                  {plan.highlightTag && (
                    <span className="inline-block px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-wider rounded-md mb-3">
                      {plan.highlightTag}
                    </span>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{plan.description || `${plan.durationMonths} Month Unlimited access`}</p>
                </div>

                {/* Categories & Pricing Table */}
                <div className="space-y-3 mb-8">
                  {plan.categories.map((cat, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                      <span className="text-xs text-slate-300">{cat.name}</span>
                      <span className="text-lg font-bold text-white">Rs. {cat.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Features List */}
                <div className="flex-grow mb-8">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">What's included</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-sm text-slate-400">
                        <svg className="w-4 h-4 text-cyan-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleBuyNow(plan)}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-cyan-900/20 active:scale-[0.98]"
                >
                  Buy Now
                </button>
              </div>
            ))}
            {/* Loading State */}
            {loading && (
              <div className="col-span-full text-center text-slate-400 py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                Loading latest plans...
              </div>
            )}

            {/* Empty State */}
            {!loading && plans.length === 0 && (
              <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
                <p className="text-slate-400 text-lg">No membership plans available at the moment.</p>
                <p className="text-slate-500 text-sm mt-2">Please check back later or contact us directly.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {showModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[95vh]">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800 flex-shrink-0">
              <h3 className="text-xl font-bold text-white">
                {user && user.membershipType !== 'None' ? 'Renew Membership' : `Enroll: ${selectedPlan.name}`}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="Close"
              >✕</button>
            </div>
            <form onSubmit={handleProceedPayment} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {user && user.membershipType !== 'None' && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 mb-2">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Your Current Plan</p>
                  <p className="text-white font-bold">{user.membershipType}</p>
                </div>
              )}
              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Membership Category</label>
                <select
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-600 transition-colors cursor-pointer appearance-none"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="" disabled>Select Category</option>
                  {selectedPlan.categories.map((cat, idx) => (
                    <option key={idx} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-950 p-5 rounded-xl space-y-3 border border-slate-800">
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Base Price</span>
                  <span className="text-white font-medium">Rs. {(selectedPlan.categories.find(c => c.name === selectedCategory)?.price || 0).toLocaleString()}</span>
                </div>

                {(!user || user.membershipStatus === 'Pending' || user.membershipType === 'None') && (
                  <>
                    <div className="flex justify-between text-slate-400 text-sm">
                      <span>Admission Fee</span>
                      <span className="text-white font-medium">Rs. 1,000</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-sm">
                      <span>Tap Door Entry Card</span>
                      <span className="text-white font-medium">Rs. 500</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-white font-bold text-xl mt-4 pt-4 border-t border-slate-800">
                  <span className="text-slate-300">Total Payable</span>
                  <span className="text-cyan-500">
                    Rs. {(
                      (selectedPlan.categories.find(c => c.name === selectedCategory)?.price || 0) +
                      ((!user || user.membershipStatus === 'Pending' || user.membershipType === 'None') ? 1500 : 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-600 outline-none transition-colors"
                    value={guestDetails.name}
                    placeholder="Enter your name"
                    onChange={e => setGuestDetails({ ...guestDetails, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
                    <input required type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:border-cyan-600 outline-none transition-colors text-sm"
                      value={guestDetails.email}
                      placeholder="Email address"
                      onChange={e => setGuestDetails({ ...guestDetails, email: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Phone</label>
                    <input required type="tel" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white focus:border-cyan-600 outline-none transition-colors text-sm"
                      value={guestDetails.phone}
                      placeholder="Phone number"
                      onChange={e => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-600 text-center uppercase tracking-wider font-bold pt-2">
                Secure Payment via Khalti
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg active:scale-[0.98]"
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Processing...
                  </div>
                ) : "Proceed to Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* About & Location Section */}
      < section id="about" className="py-20 px-4 bg-slate-900" >
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                Digital Transformation
              </h2>
              <p className="text-xl text-slate-300 mb-6 leading-relaxed">
                Dharan Fitness Club is revolutionizing the fitness industry through cutting-edge digital transformation.
                We've replaced traditional manual record-keeping with a comprehensive, automated system that enhances
                efficiency, accuracy, and member experience.
              </p>
              <p className="text-lg text-slate-400 mb-8">
                Our modern SaaS platform streamlines gym operations, from membership management to facility bookings,
                ensuring seamless coordination between staff and members while maintaining the highest standards of
                data security and user experience.
              </p>

              <div className="space-y-4">
                <div className="flex items-center text-slate-300">
                  <svg className="w-6 h-6 text-cyan-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold text-white">Location</div>
                    <div className="text-slate-400">Buddha Marga, Dharan-7</div>
                  </div>
                </div>
                <div className="flex items-center text-slate-300">
                  <svg className="w-6 h-6 text-violet-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-white">Contact</div>
                    <div className="text-slate-400 text-lg font-bold text-cyan-400">9852056919 (Call to Enroll)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Why Choose Digital?</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Efficiency</h4>
                    <p className="text-slate-400 text-sm">Automated processes reduce manual work by 80%</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Accuracy</h4>
                    <p className="text-slate-400 text-sm">Eliminate errors in membership and attendance tracking</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Insights</h4>
                    <p className="text-slate-400 text-sm">Real-time analytics for better business decisions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer className="bg-slate-950 border-t border-slate-800/50 py-12 px-4" >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent mb-4">
                Dharan Fitness Club
              </h3>
              <p className="text-slate-400 mb-6 max-w-md">
                Transforming fitness management through innovative digital solutions.
                Experience the future of gym operations.
              </p>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/DharanPhysicalFitnessCentre" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/dharanfitnessclub7" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-violet-400 transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <button onClick={() => scrollToSection('home')} className="block text-slate-400 hover:text-cyan-400 transition duration-300 text-left">
                  Home
                </button>
                <button onClick={() => scrollToSection('features')} className="block text-slate-400 hover:text-cyan-400 transition duration-300 text-left">
                  Features
                </button>
                <button onClick={() => scrollToSection('pricing')} className="block text-slate-400 hover:text-cyan-400 transition duration-300 text-left">
                  Pricing
                </button>
                <button onClick={() => scrollToSection('about')} className="block text-slate-400 hover:text-cyan-400 transition duration-300 text-left">
                  About
                </button>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Gym Information</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-slate-400">
                  <svg className="w-5 h-5 text-cyan-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-sm">Buddha Marga, Dharan-7</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <svg className="w-5 h-5 text-violet-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span className="text-sm">9852056919</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <svg className="w-5 h-5 text-cyan-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <p className="font-semibold text-white text-sm">Opening Hours</p>
                    <p className="text-xs">5 AM - 9 PM Daily</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800/50 mt-12 pt-8 text-center">
            <p className="text-slate-400">
              © 2024 Dharan Fitness Club. All rights reserved. | MERN Stack SaaS Platform
            </p>
          </div>
        </div>
      </footer >
    </div >
  );
};

export default Landing;
