import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-slate-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-green-400 hover:text-green-300 transition duration-300">
              Dharan Fitness Club
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition duration-300">
              Home
            </Link>
            <Link to="/features" className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition duration-300">
              Features
            </Link>
            <Link to="/pricing" className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition duration-300">
              Pricing
            </Link>
            <Link to="/about" className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition duration-300">
              About
            </Link>
            <Link to="/login" className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition duration-300">
              Login
            </Link>
            <Link to="/signup" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium transition duration-300">
              Join Now
            </Link>
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button className="text-gray-300 hover:text-green-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
