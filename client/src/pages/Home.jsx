import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-cover bg-center h-screen flex items-center justify-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')"}}>
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">Dharan Fitness Club</h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">Transform Your Body, Elevate Your Life</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg font-semibold text-lg transition duration-300 shadow-lg">
              Member Login
            </Link>
            <Link to="/signup" className="border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-slate-900 px-8 py-4 rounded-lg font-semibold text-lg transition duration-300">
              Join the Club
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
