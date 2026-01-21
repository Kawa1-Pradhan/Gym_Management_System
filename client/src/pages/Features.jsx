import Navbar from '../components/Navbar';

const Features = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-16 text-white">Our Core Modules</h1>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-700 p-8 rounded-lg shadow-lg text-center hover:shadow-xl transition duration-300">
              <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-green-400">Membership Tracking</h3>
              <p className="text-gray-300 mb-4">Monitor membership status, expiry dates, and renewal tracking for all members.</p>
              <ul className="text-left text-gray-400 space-y-2">
                <li>• Status monitoring (Active/Expired/Pending)</li>
                <li>• Automatic expiry notifications</li>
                <li>• Renewal management</li>
              </ul>
            </div>

            <div className="bg-slate-700 p-8 rounded-lg shadow-lg text-center hover:shadow-xl transition duration-300">
              <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-green-400">Staff Management</h3>
              <p className="text-gray-300 mb-4">Complete staff enrollment system with detailed profiles and role management.</p>
              <ul className="text-left text-gray-400 space-y-2">
                <li>• Staff profile management</li>
                <li>• Role-based access control</li>
                <li>• Enrollment tracking</li>
              </ul>
            </div>

            <div className="bg-slate-700 p-8 rounded-lg shadow-lg text-center hover:shadow-xl transition duration-300">
              <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-green-400">Secure Access</h3>
              <p className="text-gray-300 mb-4">Advanced security with JWT authentication and data encryption.</p>
              <ul className="text-left text-gray-400 space-y-2">
                <li>• JWT token authentication</li>
                <li>• Password encryption</li>
                <li>• Secure data transmission</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
