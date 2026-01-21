import { useState } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                Dharan Fitness Club
              </h1>
            </div>

            {/* Desktop Navigation */}
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
                to="/login"
                className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 px-6 py-2 rounded-lg text-sm font-semibold transition duration-300 shadow-lg hover:shadow-xl"
              >
                Member Login
              </Link>
            </div>

            {/* Mobile menu button */}
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

          {/* Mobile Navigation */}
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
                  to="/login"
                  className="block w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 px-3 py-2 rounded-lg text-base font-semibold transition duration-300 text-center mt-3"
                >
                  Member Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
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
                  Get Started
                </button>
                <Link
                  to="/signup"
                  className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 px-8 py-4 rounded-lg text-lg font-semibold transition duration-300"
                >
                  Join Now
                </Link>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="bg-slate-800 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-cyan-400">Gym Analytics</h3>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-violet-400">247</div>
                      <div className="text-sm text-slate-400">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">89%</div>
                      <div className="text-sm text-slate-400">Attendance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">23</div>
                      <div className="text-sm text-slate-400">Bookings</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 rounded-lg p-4">
                    <div className="w-8 h-8 bg-cyan-400 rounded-lg mb-2 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-950" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-1">Check-ins Today</h4>
                    <p className="text-lg font-bold text-white">156</p>
                  </div>

                  <div className="bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 rounded-lg p-4">
                    <div className="w-8 h-8 bg-violet-400 rounded-lg mb-2 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-950" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-violet-400 mb-1">Active Sessions</h4>
                    <p className="text-lg font-bold text-white">12</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Flexible membership options designed for every fitness journey. All plans include full access to gym facilities, attendance tracking, and booking systems.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1 Month Plan */}
            <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/50 hover:bg-slate-800/80 transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-white mb-2">1 Month</h3>
                <div className="text-3xl font-bold text-cyan-400 mb-1">NPR 1,500</div>
                <div className="text-slate-400">/month</div>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Gym floor usage
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Boxing access
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Attendance tracking
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Booking system
                </li>
              </ul>
              <Link
                to="/signup"
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 block text-center"
              >
                Choose Plan
              </Link>
            </div>

            {/* 3 Months Plan */}
            <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-violet-400/50 hover:bg-slate-800/80 transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-white mb-2">3 Months</h3>
                <div className="text-3xl font-bold text-violet-400 mb-1">NPR 4,000</div>
                <div className="text-slate-400">/3 months</div>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-violet-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  All 1-month features
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-violet-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Priority booking
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-violet-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Guest pass (1/month)
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-violet-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  10% savings
                </li>
              </ul>
              <Link
                to="/signup"
                className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 block text-center"
              >
                Choose Plan
              </Link>
            </div>

            {/* 6 Months Plan */}
            <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/50 hover:bg-slate-800/80 transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-white mb-2">6 Months</h3>
                <div className="text-3xl font-bold text-cyan-400 mb-1">NPR 7,200</div>
                <div className="text-slate-400">/6 months</div>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  All 3-month features
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Free personal training session
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Nutrition consultation
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  15% savings
                </li>
              </ul>
              <Link
                to="/signup"
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 block text-center"
              >
                Choose Plan
              </Link>
            </div>

            {/* Yearly Plan */}
            <div className="group bg-slate-800/50 backdrop-blur-sm border-2 border-violet-500/50 rounded-xl p-6 hover:border-violet-400 hover:bg-slate-800/80 transition-all duration-300 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Best Value
                </span>
              </div>
              <div className="text-center mb-6 pt-2">
                <h3 className="text-2xl font-semibold text-white mb-2">Yearly</h3>
                <div className="text-3xl font-bold text-violet-400 mb-1">NPR 12,000</div>
                <div className="text-slate-400">/year</div>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-violet-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  All 6-month features
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-violet-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited guest passes
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-violet-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Premium locker
                </li>
                <li className="flex items-center text-slate-300">
                  <svg className="w-4 h-4 text-violet-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  25% savings
                </li>
              </ul>
              <Link
                to="/signup"
                className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 block text-center"
              >
                Choose Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About & Location Section */}
      <section id="about" className="py-20 px-4 bg-slate-900">
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
                    <div className="text-slate-400">9852056919</div>
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
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/50 py-12 px-4">
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
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-violet-400 transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.749.097.118.112.221.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.747-1.378 0 0-.599 2.282-.744 2.84-.282 1.084-1.064 2.456-1.549 3.235C9.584 23.815 10.77 24 12.017 24c6.624 0 11.99-5.367 11.99-12C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-violet-400 transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.253 14.894 3.762 13.743 3.762 12.446s.49-2.448 1.364-3.323c.875-.875 2.026-1.365 3.323-1.365s2.448.49 3.323 1.365c.875.875 1.365 2.026 1.365 3.323s-.49 2.448-1.365 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718 0c-.873 0-1.682-.245-2.418-.737.49-1.296.49-2.806 0-4.102.736-.49 1.545-.735 2.418-.735 1.297 0 2.448.49 3.323 1.365.875.875 1.365 2.026 1.365 3.323s-.49 2.448-1.365 3.323c-.875.807-2.026 1.297-3.323 1.297z"/>
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
              <h4 className="text-lg font-semibold text-white mb-4">Staff Portal</h4>
              <Link
                to="/login"
                className="inline-block bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 px-6 py-3 rounded-lg text-white font-semibold transition duration-300 shadow-lg hover:shadow-xl"
              >
                Admin Access
              </Link>
              <p className="text-slate-400 text-sm mt-3">
                Authorized personnel only
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/50 mt-12 pt-8 text-center">
            <p className="text-slate-400">
              © 2024 Dharan Fitness Club. All rights reserved. | MERN Stack SaaS Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
