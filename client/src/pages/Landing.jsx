import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import slide1 from '../assets/bau.png';
import slide2 from '../assets/dfcpariwar.png';
import slide3 from '../assets/dfcpariwar2.jpeg';
import aboutImg from '../assets/motheraninene.png';

const slides = [
  {
    image: slide1,
    title: "Transform Your Life",
    subtitle: "Dharan's Ultimate Fitness Destination",
    description: "Join a community dedicated to strength, health, and peak performance. Your journey to excellence starts here.",
    cta: "Join the Elite",
    link: "pricing",
    positioning: "object-[center_15%]", // Frames the individual (bau) properly
    contentPos: "items-center" // Centered text for bau
  },
  {
    image: slide2,
    title: "Excellence Since 2014",
    subtitle: "A Legacy of Body Transformation",
    description: "Years of experience in changing lives through dedicated coaching and state-of-the-art facilities.",
    cta: "About Us",
    link: "about",
    positioning: "object-[center_75%]", // Pulls the bottom-heavy group shot up so bodies aren't cut off
    contentPos: "items-start pt-[15vh] md:pt-[20vh]" // Pushes text UP to the top so it doesn't cover faces
  },
  {
    image: slide3,
    title: "Unleash Your Potential",
    subtitle: "Modern Gear & Pro Coaching",
    description: "Access high-end equipment and personalized training programs tailored to your unique goals.",
    cta: "View Services",
    link: "services",
    positioning: "object-[center_35%]", // Frames the second group shot
    contentPos: "items-start pt-[15vh] md:pt-[20vh]" // Pushes text UP to prevent covering faces
  }
];

const Landing = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleContactChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await apiRequest('/api/auth/contact', {
        method: 'POST',
        body: contactForm
      });
      alert("Thank you for reaching out! We will get back to you shortly.");
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchAnalytics();
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(storedUser);

    // Auto-sliding interval
    const sliderInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    // Handle hash scrolling for #pricing
    if (window.location.hash === '#pricing') {
      scrollToSection('pricing');
    }

    return () => clearInterval(sliderInterval);
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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-red-600 selection:text-white font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to={user ? (user.role?.includes('ADMIN') ? '/admin-dashboard' : (user.role?.includes('STAFF') ? '/staff-dashboard' : '/dashboard')) : '/'} className="text-2xl font-black tracking-tight text-slate-900">
                DHARAN <span className="text-red-500">FITNESS</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('home')}
                className="text-slate-600 hover:text-red-500 px-3 py-2 text-sm font-semibold transition duration-300"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="text-slate-600 hover:text-red-500 px-3 py-2 text-sm font-semibold transition duration-300"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-slate-600 hover:text-red-500 px-3 py-2 text-sm font-semibold transition duration-300"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-slate-600 hover:text-red-500 px-3 py-2 text-sm font-semibold transition duration-300"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-slate-600 hover:text-red-500 px-3 py-2 text-sm font-semibold transition duration-300"
              >
                Contact
              </button>
              <Link
                to={user ? (user.role?.includes('ADMIN') ? '/admin-dashboard' : (user.role?.includes('STAFF') ? '/staff-dashboard' : '/dashboard')) : '/login'}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold transition duration-300 shadow-lg shadow-red-500/20"
              >
                {user ? 'DASHBOARD' : 'LOGIN'}
              </Link>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-900 hover:text-red-500 transition duration-300"
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
            <div className="md:hidden border-t border-slate-100 bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button
                  onClick={() => scrollToSection('home')}
                  className="block w-full text-left text-slate-600 hover:text-red-500 px-3 py-2 text-base font-semibold transition duration-300"
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection('services')}
                  className="block w-full text-left text-slate-600 hover:text-red-500 px-3 py-2 text-base font-semibold transition duration-300"
                >
                  Services
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="block w-full text-left text-slate-600 hover:text-red-500 px-3 py-2 text-base font-semibold transition duration-300"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="block w-full text-left text-slate-600 hover:text-red-500 px-3 py-2 text-base font-semibold transition duration-300"
                >
                  Pricing
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="block w-full text-left text-slate-600 hover:text-red-500 px-3 py-2 text-base font-semibold transition duration-300"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="block w-full text-left text-slate-600 hover:text-red-500 px-3 py-2 text-base font-semibold transition duration-300"
                >
                  Contact
                </button>
                <Link
                  to={user ? (user.role?.includes('ADMIN') ? '/admin-dashboard' : (user.role?.includes('STAFF') ? '/staff-dashboard' : '/dashboard')) : '/login'}
                  className="block w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-base font-bold transition duration-300 text-center mt-3"
                >
                  {user ? 'Go to Dashboard' : 'Login'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Slider Section */}
      <section id="home" className="relative h-screen w-full overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-full h-full object-cover grayscale-[10%] brightness-[0.6] contrast-[1.1] ${slide.positioning || 'object-center'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>

            {/* Content */}
            <div className={`relative z-20 h-full flex ${slide.contentPos || 'items-center'} px-4 md:px-12 lg:px-24`}>
              <div className="max-w-4xl text-left">
                <div className="inline-flex items-center space-x-4 mb-6 animate-fadeIn">
                  <div className="h-[2px] w-12 bg-red-500"></div>
                  <span className="text-red-500 font-bold uppercase tracking-widest text-sm">
                    {slide.subtitle}
                  </span>
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight tracking-tight">
                  {slide.title.split(' ').map((word, i) => (
                    <span key={i} className={i === 1 ? 'text-red-500' : ''}>
                      {word}{' '}
                    </span>
                  ))}
                </h1>
                <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl leading-relaxed font-medium">
                  {slide.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => scrollToSection(slide.link)}
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-sm font-bold uppercase tracking-wide transition-all duration-300 rounded-lg shadow-lg shadow-red-500/20"
                  >
                    {slide.cta}
                  </button>
                  <button
                    onClick={() => scrollToSection('services')}
                    className="px-8 py-4 text-sm font-bold uppercase tracking-wide border-2 border-white text-white hover:bg-white hover:text-slate-900 transition-all duration-300 rounded-lg"
                  >
                    Explore Services
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slider Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-12 h-1.5 rounded-full transition-all duration-500 ${index === currentSlide ? 'bg-red-500' : 'bg-white/30'
                }`}
            ></button>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8 z-30 hidden lg:block">
          <div className="flex flex-col items-center space-y-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] [writing-mode:vertical-lr]">Scroll Down</span>
            <div className="w-px h-16 bg-gradient-to-b from-red-500 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* History Highlight Section */}
      <section id="history" className="py-24 px-4 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-4 mb-8">
            <span className="text-red-500 text-sm font-bold uppercase tracking-widest">Established 2014</span>
          </div>
          <div className="relative">
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tight">
              A Legacy of <span className="text-red-500">Excellence</span>
            </h3>
            <p className="text-slate-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium">
              Dharan Fitness Club was founded with a single mission: to provide a world-class environment where athletes and beginners alike can push their limits. For over a decade, we have been the heartbeat of the local fitness community.
            </p>
          </div>
        </div>
      </section>

      {/* About Us & Statistics Section */}
      <section id="about" className="bg-[#111111] py-24 px-4 border-t border-b border-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* About Us Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            {/* Image Side */}
            <div className="relative w-full h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
              <img src={aboutImg} alt="About Us" className="w-full h-full object-cover object-[center_35%] grayscale-[20%]" />
            </div>

            {/* Content Side */}
            <div className="text-left">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-[2px] w-12 bg-red-600"></div>
                <span className="text-red-500 text-sm font-bold uppercase tracking-widest">About Us</span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
                Stronger Every Day, <br /> Fitter for Life
              </h2>

              <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8">
                Train hard, fuel smart, and live healthier with expert coaches and programs tailored for real results.
              </p>

              <div className="space-y-4 text-slate-300 font-medium mb-10">
                <div className="flex items-center space-x-4 relative before:content-[''] before:absolute before:left-[-1.5rem] before:top-1/2 before:-translate-y-1/2 before:w-4 before:h-[2px] before:bg-red-600 ml-6">
                  <span>over 20 years of experience</span>
                </div>
                <div className="flex items-center space-x-4 relative before:content-[''] before:absolute before:left-[-1.5rem] before:top-1/2 before:-translate-y-1/2 before:w-4 before:h-[2px] before:bg-red-600 ml-6">
                  <span>certified trainer</span>
                </div>
                <div className="flex items-center space-x-4 relative before:content-[''] before:absolute before:left-[-1.5rem] before:top-1/2 before:-translate-y-1/2 before:w-4 before:h-[2px] before:bg-red-600 ml-6">
                  <span>real results</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Section Inside About Us panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center divide-x-0 md:divide-x divide-slate-800 border-t border-slate-800 pt-16">
            {/* Stat 1: Years Of Experience */}
            <div className="flex flex-col items-center justify-center p-4">
              <div className="flex items-baseline space-x-1 mb-2">
                <span className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter">20</span>
                <span className="text-4xl md:text-5xl lg:text-6xl font-black text-red-500 tracking-tighter">+</span>
              </div>
              <span className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-widest mt-2 block">Years Of Experience</span>
            </div>

            {/* Stat 2: Total Members */}
            <div className="flex flex-col items-center justify-center p-4">
              <div className="flex items-baseline space-x-1 mb-2">
                <span className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter">{analytics.totalMembers || 0}</span>
                <span className="text-4xl md:text-5xl lg:text-6xl font-black text-red-500 tracking-tighter">+</span>
              </div>
              <span className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-widest mt-2 block">Total Members</span>
            </div>

            {/* Stat 3: Memberships Sold */}
            <div className="flex flex-col items-center justify-center p-4">
              <div className="flex items-baseline space-x-1 mb-2">
                <span className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter">{analytics.membershipsSold || 0}</span>
                <span className="text-4xl md:text-5xl lg:text-6xl font-black text-red-500 tracking-tighter">+</span>
              </div>
              <span className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-widest mt-2 block">Memberships Sold</span>
            </div>

            {/* Stat 4: Popular Class */}
            <div className="flex flex-col items-center justify-center p-4">
              <div className="flex items-baseline space-x-1 mb-2">
                <span className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase">{analytics.popularSession?.type || "GYM"}</span>
                <span className="text-4xl md:text-5xl lg:text-6xl font-black text-red-500 tracking-tighter">*</span>
              </div>
              <span className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-widest mt-2 block">Popular Class</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-4 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-left mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-[2px] w-12 bg-red-500"></div>
                <span className="text-red-500 text-sm font-bold uppercase tracking-widest">Our Services</span>
              </div>
              <h3 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
                Elite <span className="text-red-500">Training</span>
              </h3>
            </div>
            <p className="text-slate-600 max-w-md text-base leading-relaxed">
              Experience the pinnacle of physical training with our diverse range of elite services and professional guidance.
            </p>
          </div>

          <div className="card-grid">
            {/* Weight Training */}
            <div className="service-card group">
              <div>
                <div className="text-red-500 mb-8">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L6.28 3.43L4.86 2L3.43 3.43L2 4.86L3.43 6.28L2 7.71L3.43 9.14L2 10.57L3.43 12L7 8.43L15.57 17L12 20.57L13.43 22L14.86 20.57L16.28 22L17.71 20.57L19.14 22L20.57 20.57L22 19.14L20.57 17.71L22 16.28L20.57 14.86Z" />
                  </svg>
                </div>
                <h4 className="heading">Weight Training</h4>
                <p>Industrial-grade resistance equipment and free weights for maximum strength development.</p>
              </div>
              <p className="cta-text">Explore Space <span>→</span></p>
            </div>

            {/* Cardio Training */}
            <div className="service-card group">
              <div>
                <div className="text-red-500 mb-8">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="heading">Cardio Training</h4>
                <p>Boost your endurance with our wide range of treadmills, cycles, and elliptical trainers.</p>
              </div>
              <p className="cta-text">Explore Space <span>→</span></p>
            </div>

            {/* Sauna & Steam Bath */}
            <div className="service-card group">
              <div>
                <div className="text-red-500 mb-8">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.98 7.98 0 01-2.343 5.657z" />
                  </svg>
                </div>
                <h4 className="heading">Sauna & Steam</h4>
                <p>Relax and detoxify after your workout with our modern sauna and therapeutic steam facilities.</p>
              </div>
              <p className="cta-text">Explore Space <span>→</span></p>
            </div>

            {/* Boxing Training */}
            <div className="service-card group">
              <div>
                <div className="text-red-500 mb-8">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth="2" />
                    <path d="M9 12h6" strokeWidth="2" />
                  </svg>
                </div>
                <h4 className="heading">Boxing Zone</h4>
                <p>Learn boxing fundamentals and boost your cardio with our specialized boxing sessions.</p>
              </div>
              <p className="cta-text">Explore Space <span>→</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <span className="text-red-500 text-sm font-bold uppercase tracking-widest">Membership Tiers</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
              Choose Your <span className="text-red-500">Plan</span>
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isRecommended = plan.highlightTag || plan.durationMonths === 3;
              return (
                <div
                  key={plan._id}
                  className={`relative flex flex-col bg-white border rounded-2xl p-8 transition-all duration-300 ${isRecommended ? 'border-red-500 shadow-xl shadow-red-500/10' : 'border-slate-200 hover:border-red-300 hover:shadow-lg'
                    }`}
                >
                  {isRecommended && (
                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-red-500 text-white px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                      POPULAR
                    </div>
                  )}

                  <div className="mb-8">
                    <h4 className="text-2xl font-black text-slate-900 mb-1">{plan.name}</h4>
                    <p className="text-slate-500 text-sm font-medium">
                      {plan.durationMonths} Months Access
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.categories.map((cat, idx) => (
                      <div key={idx} className="border-b border-slate-100 pb-4 last:border-0">
                        <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-1">{cat.name}</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-4xl font-black text-slate-900 tracking-tight">Rs. {cat.price.toLocaleString()}</span>
                          <span className="text-sm text-slate-400 font-medium">/term</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex-grow mb-8">
                    <ul className="space-y-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start text-sm text-slate-600 font-medium">
                          <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleBuyNow(plan)}
                    className={`w-full py-4 text-sm font-bold uppercase tracking-wide transition-all duration-300 rounded-xl ${isRecommended ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                      }`}
                  >
                    Select Plan
                  </button>
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="col-span-full text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mb-4"></div>
              <p className="text-slate-500 font-semibold text-sm">Loading plans...</p>
            </div>
          )}

          {!loading && plans.length === 0 && (
            <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-slate-500 text-lg">No membership plans available currently.</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="py-24 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4">The Dharan Advantage</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Why <span className="text-red-500">Join Us?</span></h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
              Elevate your game with first-class equipment, world-certified coaches, and a legacy of excellence that spans over a decade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:bg-red-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Transformed Bodies</h4>
              <p className="text-slate-600 leading-relaxed text-sm">Proof in results. Hundreds of members in Dharan have completely redefined their physique and confidence here.</p>
            </div>

            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:bg-red-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Decade of Experience</h4>
              <p className="text-slate-600 leading-relaxed text-sm">Since 2014, we have stood as a beacon of fitness. Our tried and tested methods ensure you get the best out of every rep.</p>
            </div>

            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:bg-red-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Expert Coaching</h4>
              <p className="text-slate-600 leading-relaxed text-sm">Work alongside certified professionals who prioritize science-based training and personalized guidance for maximum efficiency.</p>
            </div>

            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:bg-red-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.726 2.179a2 2 0 01-1.921 1.414H7a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v10.428z" /></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Elite Gear</h4>
              <p className="text-slate-600 leading-relaxed text-sm">Train on industrial-grade, imported machinery that targets specific muscle groups for superior and safer development.</p>
            </div>

            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:bg-red-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Dynamic Classes</h4>
              <p className="text-slate-600 leading-relaxed text-sm">From heavy weights to high-intensity aerobic sessions, our varied class types keep your body guessing and growing.</p>
            </div>

            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:bg-red-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Safety First</h4>
              <p className="text-slate-600 leading-relaxed text-sm">A clean, safe, and motivating environment. We strictly adhere to hygiene standards to ensure your focus stays on your gains.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment Modal */}
      {showModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {user && user.membershipType !== 'None' ? 'Renew Membership' : `Join: ${selectedPlan.name}`}
                </h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Complete your enrollment</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
            </div>

            <form onSubmit={handleProceedPayment} className="p-6 space-y-6 overflow-y-auto">
              {user && user.membershipType !== 'None' && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Active Status</p>
                    <p className="text-slate-900 font-bold text-lg">{user.membershipType}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Select Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {selectedPlan.categories.map((cat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`p-4 rounded-xl border transition-all text-left ${selectedCategory === cat.name ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${selectedCategory === cat.name ? 'text-red-600' : 'text-slate-500'}`}>{cat.name}</p>
                      <p className="text-slate-900 font-bold text-lg">Rs. {cat.price.toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-600 text-sm">
                    <span>Base Tier Access</span>
                    <span className="text-slate-900 font-semibold">Rs. {(selectedPlan.categories.find(c => c.name === selectedCategory)?.price || 0).toLocaleString()}</span>
                  </div>
                  {(!user || user.membershipStatus === 'Pending' || user.membershipType === 'None') && (
                    <>
                      <div className="flex justify-between text-slate-600 text-sm">
                        <span>Admission One-Time</span>
                        <span className="text-slate-900 font-semibold">Rs. 1,000</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-sm">
                        <span>Smart Entry Card</span>
                        <span className="text-slate-900 font-semibold">Rs. 500</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-slate-900 text-lg font-black mt-4 pt-4 border-t border-slate-200">
                    <span>Total Payable</span>
                    <span className="text-red-600">Rs. {((selectedPlan.categories.find(c => c.name === selectedCategory)?.price || 0) + ((!user || user.membershipStatus === 'Pending' || user.membershipType === 'None') ? 1500 : 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">Member Details</label>
                <div className="space-y-3">
                  <input required type="text" value={guestDetails.name} onChange={e => setGuestDetails({ ...guestDetails, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-red-500 focus:bg-white outline-none transition-all font-medium text-sm" placeholder="Full Name" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input required type="email" value={guestDetails.email} onChange={e => setGuestDetails({ ...guestDetails, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-red-500 focus:bg-white outline-none transition-all font-medium text-sm" placeholder="Email Address" />
                    <input required type="tel" value={guestDetails.phone} onChange={e => setGuestDetails({ ...guestDetails, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-red-500 focus:bg-white outline-none transition-all font-medium text-sm" placeholder="Phone Number" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center mt-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-md shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {processing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing...
                    </div>
                  ) : "Proceed to Payment"}
                </button>
                <p className="text-xs text-slate-500 font-medium mt-4">Secured via Khalti Gateway</p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Integrated About & Contact Section */}
      <section id="contact" className="py-24 px-4 bg-slate-50 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* About Side */}
            <div className="space-y-12">
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-[2px] w-12 bg-red-500"></div>
                  <span className="text-red-500 font-bold uppercase tracking-widest text-sm">Legacy & Innovation</span>
                </div>
                <h3 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
                  Where Grit<br />
                  <span className="text-red-500">Meets Tech</span>
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed font-medium">
                  Dharan Fitness Club is more than a gym. It's an ecosystem of power. We bridge the gap between old-school discipline and modern digital efficiency.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 flex-shrink-0 group-hover:bg-red-500 group-hover:text-white transition-all transform group-hover:-rotate-12">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-bold text-lg mb-1 tracking-tight">Main HQ</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">Buddha Marga, Dharan-7<br />Sunsari, Nepal</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 flex-shrink-0 group-hover:bg-red-500 group-hover:text-white transition-all transform group-hover:rotate-12">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-bold text-lg mb-1 tracking-tight">Support</h4>
                    <p className="text-slate-600 text-sm">dharanfitnessclub@gmail.com</p>
                    <p className="text-red-500 font-bold text-sm mt-1">9852056919</p>
                  </div>
                </div>
              </div>

              {/* Map Integration */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden relative group h-64 shadow-sm hover:shadow-lg transition-all duration-500">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14164.78652234057!2d87.2721!3d26.8129!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ef417551ec7379%3A0x7d6c5476a6b8c8d2!2sDharan%20Fitness!5e0!3m2!1sen!2snp!4v1700000000000!5m2!1sen!2snp"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  className="transition-transform duration-700 group-hover:scale-105"
                ></iframe>
              </div>
            </div>

            {/* Contact Form Side */}
            <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Get In <span className="text-red-500">Touch</span></h3>

                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                      <input
                        required
                        type="text"
                        name="name"
                        value={contactForm.name}
                        onChange={handleContactChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-red-500 focus:bg-white outline-none transition-all font-medium text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={contactForm.email}
                        onChange={handleContactChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-red-500 focus:bg-white outline-none transition-all font-medium text-sm"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                    <input
                      required
                      type="text"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleContactChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-red-500 focus:bg-white outline-none transition-all font-medium text-sm"
                      placeholder="Membership Inquiry"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                    <textarea
                      required
                      name="message"
                      value={contactForm.message}
                      onChange={handleContactChange}
                      rows="4"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-red-500 focus:bg-white outline-none transition-all font-medium text-sm resize-none"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-lg shadow-md shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {processing ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 text-white">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <h3 className="text-3xl font-black tracking-tight">
                Dharan <span className="text-red-500">Fitness</span>
              </h3>
              <p className="text-slate-400 text-sm font-medium max-w-sm leading-relaxed">
                The only bad workout is the one that didn't happen. Join us and transform your life with premier facilities and expert guidance.
              </p>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/DharanPhysicalFitnessCentre" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-red-500 hover:text-white transition-all duration-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-200 uppercase tracking-widest text-sm mb-6">Explore</h4>
              <ul className="space-y-4">
                {['home', 'services', 'pricing', 'about', 'contact'].map(sec => (
                  <li key={sec}>
                    <button onClick={() => scrollToSection(sec)} className="text-slate-400 text-sm font-medium hover:text-red-500 transition-colors capitalize">
                      {sec}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="font-bold text-slate-200 uppercase tracking-widest text-sm mb-4">Location</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Buddha Marga, Dharan-7<br />Sunsari, Nepal
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-200 uppercase tracking-widest text-sm mb-4">Contact</h4>
                <p className="text-slate-300 text-lg font-bold">9852056919</p>
                <p className="text-slate-400 text-sm mt-1">dharanfitnessclub@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm font-medium">
              © {new Date().getFullYear()} Dharan Fitness Centre. All Rights Reserved.
            </p>
            <div className="flex space-x-6">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">MERN Platform V2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
