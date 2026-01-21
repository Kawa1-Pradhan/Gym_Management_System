import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Pricing = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-16 text-white">Membership Plans</h1>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className="bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-700 hover:border-green-500 transition duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Basic</h3>
                <div className="text-4xl font-bold text-green-400 mb-2">NPR 2,000<span className="text-lg text-gray-400">/month</span></div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Access to gym equipment
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Locker facility
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Free fitness assessment
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  24/7 gym access
                </li>
              </ul>
              <Link to="/signup" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition duration-300 block text-center">
                Choose Basic
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-800 p-8 rounded-lg shadow-lg border-2 border-green-500 hover:shadow-xl transition duration-300 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <div className="text-center mb-8 pt-4">
                <h3 className="text-2xl font-semibold text-white mb-4">Pro</h3>
                <div className="text-4xl font-bold text-green-400 mb-2">NPR 3,500<span className="text-lg text-gray-400">/month</span></div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  All Basic features
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Personal trainer sessions (2/month)
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Group fitness classes
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Nutrition consultation
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Priority booking
                </li>
              </ul>
              <Link to="/signup" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition duration-300 block text-center">
                Choose Pro
              </Link>
            </div>

            {/* Elite Plan */}
            <div className="bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-700 hover:border-green-500 transition duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-white mb-4">Elite</h3>
                <div className="text-4xl font-bold text-green-400 mb-2">NPR 5,000<span className="text-lg text-gray-400">/month</span></div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  All Pro features
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Dedicated personal trainer
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Spa and recovery services
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  VIP lounge access
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Guest privileges
                </li>
              </ul>
              <Link to="/signup" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition duration-300 block text-center">
                Choose Elite
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
