import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import InventoryComponent from '../components/InventoryComponent';
import Sidebar from '../components/Sidebar';
import Reports from './Reports';
import { Dumbbell, ChevronRight, Trophy, Coins } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
      <div
        className="bg-neutral-900 w-full max-w-xl rounded-2xl shadow-2xl border border-neutral-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-black/30">
          <h2 className="text-lg font-bold text-white uppercase tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all text-xl"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color = 'red', onClick }) => {
  const colorClasses = {
    blue: 'text-white',
    green: 'text-green-400',
    orange: 'text-orange-400',
    purple: 'text-white',
    red: 'text-red-500',
    cyan: 'text-white',
    neutral: 'text-neutral-400',
    white: 'text-white'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg relative overflow-hidden group transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-red-600/30 hover:translate-y-[-2px]' : ''}`}
    >
      <div className="flex flex-col">
        <p className="text-sm text-neutral-500 mb-1 font-medium">{title}</p>
        <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
      </div>
    </div>
  );
};

const PlanCard = ({ plan, onUpdate }) => {
  const [categories, setCategories] = useState(plan.categories || []);
  const [loading, setLoading] = useState(false);

  const handlePriceChange = (index, newPrice) => {
    const updated = [...categories];
    updated[index].price = Number(newPrice);
    setCategories(updated);
  };

  const handleToggleCategory = (index) => {
    const updated = [...categories];
    updated[index].isActive = !updated[index].isActive;
    setCategories(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    await onUpdate(plan._id, { categories });
    setLoading(false);
  };

  return (
    <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg relative h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${plan.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
          {plan.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-4 flex-grow">
        <div className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Category Pricing</div>
        {categories.map((cat, idx) => (
          <div key={idx} className="space-y-1 pb-3 border-b border-neutral-800/50 last:border-0">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-300">{cat.name}</span>
              <button
                onClick={() => handleToggleCategory(idx)}
                className={`text-[10px] px-2 py-0.5 rounded ${cat.isActive ? 'bg-red-900/40 text-red-400' : 'bg-neutral-800 text-neutral-500'}`}
              >
                {cat.isActive ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 text-xs font-mono">Rs.</span>
              <input
                type="number"
                value={cat.price}
                onChange={(e) => handlePriceChange(idx, e.target.value)}
                onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                className="w-full bg-black border border-neutral-800 rounded p-1.5 text-white text-sm focus:border-red-500 outline-none transition-colors"
                disabled={!cat.isActive}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 mt-4 border-t border-neutral-800 flex justify-between items-center">
        <button
          onClick={() => onUpdate(plan._id, { isActive: !plan.isActive })}
          className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          {plan.isActive ? 'Disable Package' : 'Enable Package'}
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Category Prices'}
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceFilters, setAttendanceFilters] = useState({ date: '', memberId: '' });
  const [fullNotifications, setFullNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeBookings: 0,
    totalSessions: 0,
    staffMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    monthlyRevenue: 0,
    expiringSoon: 0,
    activeSessionsToday: 0,
    newMembersThisMonth: 0,
    mostBookedType: 'N/A',
    planDistribution: [
      { name: '1 Month', count: 0 },
      { name: '3 Months', count: 0 },
      { name: '6 Months', count: 0 },
      { name: 'Yearly', count: 0 }
    ]
  });
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const navigate = useNavigate();

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    password: '123456789' // Default password
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    targetRoles: ['MEMBER'],
    isImportant: false
  });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  const [showAwardPointsModal, setShowAwardPointsModal] = useState(false);
  const [awardPointsData, setAwardPointsData] = useState({
    memberId: '',
    points: 10,
    reason: ''
  });

  const [newMilestone, setNewMilestone] = useState({});
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  const [pointRules, setPointRules] = useState([]);
  const [pointHistory, setPointHistory] = useState([]);
  const [showPointRuleModal, setShowPointRuleModal] = useState(false);
  const [editingPointRule, setEditingPointRule] = useState(null);

  useEffect(() => {
    checkAdminAccess();
    loadData();
  }, [activeTab, attendanceFilters]);

  const checkAdminAccess = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token || !userData.role || !userData.role.includes('ADMIN')) {
      navigate('/dashboard');
      return;
    }

    setUser(userData);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('AdminDashboard: Starting data refresh...');

      const endpoints = {
        users: '/api/users',
        bookings: '/api/bookings',
        boxing: '/api/sessions/boxing',
        sauna: '/api/sessions/sauna',
        plans: '/api/membership/plans',
        milestones: '/api/achievements/milestones',
        rules: '/api/achievements/rules',
        history: '/api/achievements/history'
      };

      const results = await Promise.allSettled(
        Object.values(endpoints).map(url => apiRequest(url))
      );

      const data = {};
      const failed = [];

      Object.keys(endpoints).forEach((key, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          data[key] = result.value;
        } else {
          console.error(`AdminDashboard: Request to ${endpoints[key]} failed:`, result.reason);
          failed.push(`${key} (${result.reason})`);
          data[key] = []; // Fallback to empty array
        }
      });

      if (failed.length > 0) {
        console.warn('AdminDashboard: Some data failed to load:', failed.join(', '));
      }

      const fetchedUsers = Array.isArray(data.users) ? data.users : [];
      const fetchedBookings = Array.isArray(data.bookings) ? data.bookings : [];
      const fetchedBoxing = Array.isArray(data.boxing) ? data.boxing : [];
      const fetchedSauna = Array.isArray(data.sauna) ? data.sauna : [];
      const fetchedPlans = Array.isArray(data.plans) ? data.plans : [];

      const fetchedSessions = [
        ...fetchedBoxing.map(s => ({ ...s, type: 'Boxing' })),
        ...fetchedSauna.map(s => ({ ...s, type: 'Sauna' }))
      ];

      // Update basic states
      setUsers(fetchedUsers);
      setBookings(fetchedBookings);
      setSessions(fetchedSessions);
      setPlans(fetchedPlans);
      setMilestones(Array.isArray(data.milestones) ? data.milestones : []);
      setPointRules(Array.isArray(data.rules) ? data.rules : []);
      setPointHistory(Array.isArray(data.history) ? data.history : []);

      // Load attendance reports if that tab is active
      if (activeTab === 'attendance') {
        try {
          let url = '/api/attendance/reports';
          const params = new URLSearchParams();
          if (attendanceFilters.date) params.append('date', attendanceFilters.date);
          if (attendanceFilters.memberId) params.append('memberId', attendanceFilters.memberId);
          if (params.toString()) url += `?${params.toString()}`;

          const reports = await apiRequest(url);
          setAttendanceRecords(Array.isArray(reports) ? reports : []);
        } catch (err) {
          console.error('Error loading attendance reports:', err);
        }
      }

      // Load full notification history for the log tab
      try {
        const notifData = await apiRequest('/api/notifications?limit=50');
        setFullNotifications(notifData?.notifications || []);
      } catch (err) {
        console.error('Error loading notification history:', err);
      }

      // Load announcements
      try {
        const announcementsData = await apiRequest('/api/announcements');
        setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
      } catch (err) {
        console.error('Error loading announcements:', err);
      }

      // Build Date Range for current month (stats only)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
      const todayDateStr = now.toLocaleDateString('en-CA');

      // Fetch accurate revenue stats
      let monthRevenue = 0;
      let consolidatedPlans = [
        { name: '1 Month', count: 0 },
        { name: '3 Months', count: 0 },
        { name: '6 Months', count: 0 },
        { name: 'Yearly', count: 0 }
      ];

      try {
        // Fetch current month for the revenue card
        const monthlyRevData = await apiRequest(`/api/reports/revenue?startDate=${firstDayOfMonth}&endDate=${todayDateStr}`);
        monthRevenue = monthlyRevData?.summary?.totalRevenue || 0;

        // Fetch LIFETIME stats for the best-selling plans chart
        const totalRevData = await apiRequest(`/api/reports/revenue?startDate=2020-01-01&endDate=${todayDateStr}`);

        // Process Best Selling Plans
        const categoriesMap = {
          '1 Month': 0,
          '3 Months': 0,
          '6 Months': 0,
          'Yearly': 0
        };

        (totalRevData?.details || []).forEach(d => {
          const planName = d.planName || "";
          if (planName.includes('1 Month')) categoriesMap['1 Month'] += d.count;
          else if (planName.includes('3 Months')) categoriesMap['3 Months'] += d.count;
          else if (planName.includes('6 Months')) categoriesMap['6 Months'] += d.count;
          else if (planName.includes('Yearly')) categoriesMap['Yearly'] += d.count;
          else {
            const baseName = planName.split(' - ')[0].split(' (')[0];
            if (categoriesMap[baseName] !== undefined) categoriesMap[baseName] += d.count;
          }
        });

        consolidatedPlans = Object.entries(categoriesMap).map(([name, count]) => ({ name, count }));
      } catch (err) {
        console.error('Error loading revenue reports:', err);
      }

      // Calculate member stats
      const members = fetchedUsers.filter(u => u.role?.includes('MEMBER'));
      const activeMembers = members.filter(m => m.isActive !== false);
      const inactiveMembers = members.filter(m => m.isActive === false);

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const expiringSoonCount = members.filter(m => {
        if (!m.membershipExpiryDate) return false;
        const endDate = new Date(m.membershipExpiryDate);
        return endDate >= now && endDate <= sevenDaysFromNow;
      }).length;

      const todayStr = now.toLocaleDateString('en-CA');
      const activeSessionsTodayCount = fetchedSessions.filter(s => {
        if (!s || !s.date) return false;
        const sDate = new Date(s.date).toLocaleDateString('en-CA');
        return sDate === todayStr && s.status === 'Active';
      }).length;

      const newMembersThisMonthCount = members.filter(m => {
        if (!m.createdAt) return false;
        const createdDate = new Date(m.createdAt);
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return createdDate >= start && createdDate <= now;
      }).length;

      const boxingCount = fetchedBookings.filter(b => b.sessionType === 'Boxing').length;
      const saunaCount = fetchedBookings.filter(b => b.sessionType === 'Sauna').length;
      let mostBookedType = 'N/A';
      if (boxingCount > 0 || saunaCount > 0) {
        if (boxingCount > saunaCount) mostBookedType = 'Boxing';
        else if (saunaCount > boxingCount) mostBookedType = 'Sauna';
        else mostBookedType = 'Both Equal';
      }

      setStats({
        totalUsers: fetchedUsers.length,
        activeBookings: fetchedBookings.filter(b => b.status === 'Booked').length,
        totalSessions: fetchedSessions.length,
        staffMembers: fetchedUsers.filter(u => u.role?.includes('STAFF')).length,
        activeMembers: activeMembers.length,
        inactiveMembers: inactiveMembers.length,
        monthlyRevenue: monthRevenue,
        expiringSoon: expiringSoonCount,
        activeSessionsToday: activeSessionsTodayCount,
        newMembersThisMonth: newMembersThisMonthCount,
        mostBookedType: mostBookedType,
        planDistribution: consolidatedPlans
      });

      if (failed.length > 0) {
        setError(`Partial data loaded. Some systems are unreachable: ${failed.join(', ')}`);
      }
    } catch (err) {
      console.error('AdminDashboard: Fatal error in loadData:', err);
      setError(`Critical error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (planId, updates) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await apiRequest(`/api/membership/plans/${planId}`, { method: 'PATCH', body: updates });
      setSuccess('Plan updated successfully');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || "Failed to update plan");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...newStaff,
          role: 'STAFF',
          membershipStatus: 'Active'
        }
      });

      setSuccess('Staff member created successfully!');
      setNewStaff({ name: '', email: '', phone: '', password: '123456789' });
      setShowAddStaffModal(false);
      setActiveTab('admin-staff');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiRequest('/api/announcements', {
        method: 'POST',
        body: newAnnouncement
      });

      setSuccess('Announcement broadcasted successfully!');
      setNewAnnouncement({ title: '', message: '', targetRoles: ['MEMBER'], isImportant: false });
      setShowAnnouncementModal(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to broadcast announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (newMilestone._id) {
        await apiRequest(`/api/achievements/milestones/${newMilestone._id}`, {
          method: 'PUT',
          body: newMilestone
        });
      } else {
        await apiRequest('/api/achievements/milestones', {
          method: 'POST',
          body: newMilestone
        });
      }

      setSuccess('Milestone saved successfully!');
      setShowMilestoneModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save milestone');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!window.confirm("Are you sure you want to delete this milestone?")) return;
    try {
      await apiRequest(`/api/achievements/milestones/${id}`, { method: 'DELETE' });
      setSuccess('Milestone deleted successfully');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete milestone');
    }
  };

  const handleAwardPoints = async (e) => {
    e.preventDefault();
    if (!awardPointsData.memberId || !awardPointsData.points) return;
    try {
      setLoading(true);
      await apiRequest('/api/achievements/award-points', {
        method: 'POST',
        body: awardPointsData
      });
      setSuccess('Points awarded successfully!');
      setShowAwardPointsModal(false);
      setAwardPointsData({ memberId: '', points: 10, reason: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to award points');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePointRule = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiRequest(`/api/achievements/rules/${editingPointRule._id}`, {
        method: 'PUT',
        body: editingPointRule
      });
      setSuccess('Point rule updated successfully');
      setShowPointRuleModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update rule');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let endpoint = '';
      let method = 'POST';
      let confirmMsg = '';

      switch (action) {
        case 'Deactivate':
        case 'Activate':
          endpoint = `/api/users/${userId}/deactivate`;
          method = 'PATCH';
          confirmMsg = `Are you sure you want to ${action.toLowerCase()} this user?`;
          break;
        case 'Reset Password':
          endpoint = `/api/users/${userId}/reset-password`;
          confirmMsg = 'Generate a new password and send it via email?';
          break;
        case 'Resend Credentials':
          endpoint = `/api/users/${userId}/resend-credentials`;
          confirmMsg = 'Resend enrollment credentials to this user?';
          break;
        case 'Delete':
          endpoint = `/api/users/${userId}`;
          method = 'DELETE';
          confirmMsg = 'WARNING: This will permanently delete the user and all their associated data. This action CANNOT be undone. Proceed?';
          break;
        default: return;
      }

      if (window.confirm(confirmMsg)) {
        await apiRequest(endpoint, { method });
        setSuccess(`${action} successful!`);
        await loadData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || `Failed to ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const ADMIN_TABS = [
    { id: 'home', label: 'Dashboard' },
    { id: 'members', label: 'Members' },
    { id: 'admin-staff', label: 'Staff' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'plans', label: 'Plans' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'reports', label: 'Reports' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'points', label: 'Point System' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'notifications', label: 'Notification Log' }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Fixed Sidebar for Desktop */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          role="ADMIN"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-black/80 backdrop-blur-md border-b border-neutral-900 sticky top-0 z-30 px-4 sm:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="md:hidden flex items-center gap-3">
              <h1 className="text-white font-bold text-lg tracking-tight">DFC<span className="text-red-600">.</span></h1>
            </div>

            {/* Desktop breadcrumb or title */}
            <div className="hidden md:block">
              <h2 className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="opacity-50">Admin</span>
                <ChevronRight size={12} className="opacity-30" />
                <span className="text-white tracking-[0.2em]">{ADMIN_TABS.find(t => t.id === activeTab)?.label}</span>
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu />
              <button
                className="md:hidden p-2 rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile slide-down nav */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-neutral-900 mt-4 pt-4 pb-2 animate-in slide-in-from-top duration-300">
              <div className="space-y-1">
                {ADMIN_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* Messages */}
          {error && <div className="bg-red-600 text-white p-4 rounded-lg mb-6 shadow-xl animate-in shake duration-300">{error}</div>}
          {success && <div className="bg-green-600 text-white p-4 rounded-lg mb-6 shadow-xl animate-in slide-in-from-top duration-300">{success}</div>}

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'home' && (
              <div>
                <h1 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-8 text-white">Admin Dashboard</h1>

                <div className="mb-8">
                  <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Quick Stats</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Members" value={stats.totalUsers || 0} color="white" onClick={() => setActiveTab('members')} />
                    <StatCard title="Sessions Today" value={stats.activeSessionsToday || 0} color="red" onClick={() => setActiveTab('sessions')} />
                    <StatCard title="New This Month" value={stats.newMembersThisMonth || 0} color="green" onClick={() => setActiveTab('members')} />
                    <StatCard title="Top Session" value={stats.mostBookedType || 'N/A'} color="orange" onClick={() => setActiveTab('sessions')} />
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Membership Metrics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Active Members" value={stats.activeMembers || 0} color="green" onClick={() => setActiveTab('members')} />
                    <StatCard title="Inactive Members" value={stats.inactiveMembers || 0} color="orange" onClick={() => setActiveTab('members')} />
                    <StatCard title="Monthly Revenue" value={`NPR ${(stats.monthlyRevenue || 0).toLocaleString()}`} color="white" />
                    <StatCard title="Expiring Soon" value={stats.expiringSoon || 0} color="red" onClick={() => setActiveTab('members')} />
                  </div>
                </div>

                <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-xl mb-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-white">Total Membership Distribution</h3>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Lifetime Popularity of Core Packages</p>
                    </div>
                    {stats.planDistribution && stats.planDistribution.length > 0 && (
                      <div className="bg-red-600/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                          Best Seller: {[...stats.planDistribution].sort((a, b) => b.count - a.count)[0].name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="h-80 w-full bg-black/20 p-4 rounded-xl border border-neutral-800/50">
                    {stats.planDistribution && stats.planDistribution.some(p => p.count > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.planDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
                          <XAxis
                            dataKey="name"
                            stroke="#525252"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            fontFamily="Inter, sans-serif"
                            fontWeight={700}
                          />
                          <YAxis
                            stroke="#525252"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            fontFamily="Inter, sans-serif"
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0a0a0a',
                              borderColor: '#262626',
                              borderRadius: '12px',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                              border: '1px solid #404040'
                            }}
                            cursor={{ fill: '#262626', opacity: 0.4 }}
                          />
                          <Bar
                            dataKey="count"
                            radius={[6, 6, 0, 0]}
                            barSize={60}
                          >
                            <LabelList
                              dataKey="count"
                              position="top"
                              fill="#ffffff"
                              fontSize={12}
                              fontWeight={900}
                              offset={10}
                            />
                            {stats.planDistribution.map((entry, index) => {
                              const maxVal = Math.max(...stats.planDistribution.map(p => p.count));
                              return (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.count === maxVal && entry.count > 0 ? '#ef4444' : '#404040'}
                                  className="transition-all duration-500"
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-neutral-600">
                        <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                        <p className="text-sm font-medium italic">No historical sales data found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <>
                <div className="flex justify-between items-center gap-3 mb-8">
                  <div>
                    <h1 className="text-xl sm:text-3xl font-bold">Member Management</h1>
                    <p className="text-neutral-500 text-xs mt-1">Manage gym membership accounts and status.</p>
                  </div>
                </div>

                <div className="bg-neutral-900 rounded-xl shadow-lg border border-neutral-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-black/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase">User Info</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase">Plan</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {users.filter(u => u.role?.includes('MEMBER') && !u.role?.some(r => ['ADMIN', 'STAFF'].includes(r))).map(u => (
                          <tr key={u._id} className="hover:bg-neutral-800/30 cursor-pointer group transition-colors" onClick={() => { setSelectedUserDetail(u); setShowUserDetailModal(true); }}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{u.name}</div>
                              <div className="text-xs text-neutral-500">{u.email}</div>
                              <div className="text-[10px] text-neutral-600 mt-1">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-neutral-300 font-medium">{u.membershipType || 'None'}</div>
                              {u.membershipExpiryDate && <div className="text-[10px] text-neutral-500">Exp: {new Date(u.membershipExpiryDate).toLocaleDateString()}</div>}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${u.isActive === false ? 'text-red-500' : 'text-green-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.isActive === false ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
                                {u.isActive === false ? 'Inactive' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setSelectedUserDetail(u); setShowUserDetailModal(true); }} className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg border border-neutral-700 transition" title="View Details">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                <button onClick={() => handleUserAction(u._id, u.isActive === false ? 'Activate' : 'Deactivate')} className={`p-2 rounded-lg border transition ${u.isActive === false ? 'bg-green-900/20 text-green-400 border-green-500/20' : 'bg-neutral-800 hover:bg-red-900/20 text-orange-400 border-neutral-700'}`} title="Toggle Status">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                </button>
                                <button onClick={() => handleUserAction(u._id, 'Delete')} className="p-2 bg-neutral-800 hover:bg-red-900/40 text-red-500 rounded-lg border border-neutral-700 transition" title="Delete User">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'admin-staff' && (
              <>
                <div className="flex justify-between items-center gap-3 mb-8">
                  <div>
                    <h1 className="text-xl sm:text-3xl font-bold">Staff Management</h1>
                    <p className="text-neutral-500 text-xs mt-1">Manage staff members and their system access.</p>
                  </div>
                  <button onClick={() => setShowAddStaffModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 rounded-md font-bold text-sm whitespace-nowrap shadow-lg transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Staff
                  </button>
                </div>

                <div className="bg-neutral-900 rounded-xl shadow-lg border border-neutral-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-black/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase">User Info</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase">Role</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {users.filter(u => u.role?.includes('STAFF') && !u.role?.includes('ADMIN')).map(u => (
                          <tr key={u._id} className="hover:bg-neutral-800/30 cursor-pointer group transition-colors" onClick={() => { setSelectedUserDetail(u); setShowUserDetailModal(true); }}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{u.name}</div>
                              <div className="text-xs text-neutral-500">{u.email}</div>
                              <div className="text-[10px] text-neutral-600 mt-1">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-red-900/20 text-red-400 border border-red-500/20">
                                Staff
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${u.isActive === false ? 'text-red-500' : 'text-green-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.isActive === false ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
                                {u.isActive === false ? 'Inactive' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                {!u.role?.includes('ADMIN') && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedUserDetail(u); setShowUserDetailModal(true); }} className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg border border-neutral-700 transition" title="View Details">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </button>
                                    <button onClick={() => handleUserAction(u._id, u.isActive === false ? 'Activate' : 'Deactivate')} className={`p-2 rounded-lg border transition ${u.isActive === false ? 'bg-green-900/20 text-green-400 border-green-500/20' : 'bg-neutral-800 hover:bg-red-900/20 text-orange-400 border-neutral-700'}`} title="Toggle Status">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                    </button>
                                    <button onClick={() => handleUserAction(u._id, 'Delete')} className="p-2 bg-neutral-800 hover:bg-red-900/40 text-red-500 rounded-lg border border-neutral-700 transition" title="Delete User">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h1 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-8">Booking Oversight</h1>
                <div className="bg-neutral-900 rounded-lg shadow-lg border border-neutral-800 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-neutral-800 bg-neutral-800/30 font-bold">Active Reservations</div>
                  <div className="divide-y divide-neutral-800">
                    {bookings.filter(b => b.status === "Booked").map(b => (
                      <div key={b._id} className="p-4 sm:p-6 flex flex-wrap justify-between items-center gap-2 hover:bg-neutral-800/20">
                        <div>
                          <div className="font-bold text-white">{b.memberId?.name || 'Unknown'}</div>
                          <div className="text-sm text-neutral-500">{b.sessionType} • {b.sessionDetails?.name}</div>
                        </div>
                        <button onClick={async () => {
                          if (window.confirm("Cancel this booking?")) {
                            await apiRequest(`/api/bookings/${b._id}`, { method: 'DELETE' });
                            loadData();
                          }
                        }} className="text-red-500 text-sm font-bold hover:underline">Cancel Booking</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div>
                <h1 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-8">Session Management</h1>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.map(s => (
                    <div key={s._id} className="bg-neutral-900 p-6 rounded-lg border border-neutral-800 shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.type === "Boxing" ? "bg-red-900/50 text-red-400" : "bg-neutral-800 text-neutral-400"}`}>{s.type}</span>
                        <span className={`text-[10px] font-bold uppercase ${s.status === "Active" ? "text-green-500" : "text-red-500"}`}>{s.status}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{s.name}</h3>
                      <p className="text-neutral-500 text-sm mb-4">Capacity: {s.availableSlots} / {s.maxCapacity}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button onClick={async () => {
                          const n = prompt("New Max Capacity?", s.maxCapacity);
                          if (n) { await apiRequest(`/api/sessions/${s.type.toLowerCase()}/${s._id}`, { method: 'PUT', body: { maxCapacity: parseInt(n) } }); loadData(); }
                        }} className="bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded transition">Capacity</button>
                        <button onClick={async () => {
                          if (window.confirm("Delete this session?")) { await apiRequest(`/api/sessions/${s.type.toLowerCase()}/${s._id}`, { method: 'DELETE' }); loadData(); }
                        }} className="bg-red-900/30 text-red-400 hover:bg-red-900/50 px-3 py-1.5 rounded transition">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-xl sm:text-3xl font-bold">Attendance Oversight</h1>
                    <p className="text-slate-500 text-xs mt-1">Monitor member activity and participation levels.</p>
                  </div>
                </div>

                {/* Attendance Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Today's Check-ins</p>
                    <p className="text-3xl font-black text-white">{attendanceRecords.filter(r => new Date(r.date).toLocaleDateString() === new Date().toLocaleDateString()).length}</p>
                    <p className="text-[10px] text-green-500 mt-2 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Tracking Live
                    </p>
                  </div>

                  <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                    </div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Weekly Avg</p>
                    <p className="text-3xl font-black text-white">{(attendanceRecords.length / 7).toFixed(1)}</p>
                    <p className="text-[10px] text-neutral-500 mt-2 font-medium italic">Based on filtered data</p>
                  </div>

                  <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Peak Time</p>
                    <p className="text-3xl font-black text-red-500">06:00 PM</p>
                    <p className="text-[10px] text-neutral-500 mt-2 font-medium italic">Usually busiest hour</p>
                  </div>
                </div>

                <div className="bg-neutral-900 rounded-2xl shadow-xl border border-neutral-800 overflow-hidden">
                  <div className="p-6 border-b border-neutral-800 bg-black/30 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Filter by Member</label>
                      <select value={attendanceFilters.memberId} onChange={(e) => setAttendanceFilters({ ...attendanceFilters, memberId: e.target.value })} className="w-full bg-black border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-red-500 transition-colors">
                        <option value="">All Active Members</option>
                        {users.filter(u => u.role?.includes('MEMBER')).map(m => (<option key={m._id} value={m._id}>{m.name}</option>))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Filter by Date</label>
                      <input type="date" value={attendanceFilters.date} onChange={(e) => setAttendanceFilters({ ...attendanceFilters, date: e.target.value })} className="w-full bg-black border border-neutral-800 rounded-xl p-2 text-white outline-none focus:border-red-500 transition-colors min-h-[44px]" />
                    </div>
                    <button onClick={() => setAttendanceFilters({ date: '', memberId: '' })} className="bg-neutral-800 hover:bg-neutral-700 px-6 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider">Reset</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-black/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Member Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Date &amp; Time</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Marked By</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/50">
                        {attendanceRecords.length === 0 ? (
                          <tr><td colSpan="4" className="px-6 py-12 text-center text-neutral-500 italic">No attendance records found for the selected criteria.</td></tr>
                        ) : (
                          attendanceRecords.map(r => (
                            <tr key={r._id} className="hover:bg-neutral-800/20 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-white">{r.member?.name}</div>
                                <div className="text-[10px] text-neutral-500">{r.member?.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-neutral-300 font-medium">{new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                <div className="text-[10px] text-neutral-500">{new Date(r.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs text-neutral-400 bg-neutral-800/50 px-2 py-1 rounded-md">{r.markedBy?.name || 'System'}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="px-3 py-1 bg-green-950/30 text-green-400 rounded-full text-[10px] font-black uppercase border border-green-500/20 shadow-sm shadow-green-500/10 tracking-widest">{r.status}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'plans' && (
              <div>
                <h1 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-8">Membership Plans</h1>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map(plan => (<PlanCard key={plan._id} plan={plan} onUpdate={handleUpdatePlan} />))}
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (<InventoryComponent />)}
            {activeTab === 'reports' && (<Reports />)}

            {activeTab === 'announcements' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-xl sm:text-3xl font-bold">Communication Center</h1>
                    <p className="text-slate-500 text-xs mt-1">Broadcast announcements to gym members and staff.</p>
                  </div>
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                    New Broadcast
                  </button>
                </div>

                <div className="bg-neutral-900 rounded-xl shadow-lg border border-neutral-800 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-neutral-800 bg-neutral-800/30 flex justify-between items-center">
                    <span className="font-bold uppercase tracking-widest text-xs text-neutral-400">Broadcast History</span>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{announcements.length} sent</span>
                  </div>
                  <div className="divide-y divide-neutral-800/60">
                    {announcements.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                        <p className="text-neutral-500 italic text-sm">No announcements yet. Send your first broadcast above.</p>
                      </div>
                    ) : (
                      announcements.map(a => (
                        <div key={a._id} className="p-5 flex justify-between items-start gap-4 hover:bg-neutral-800/20 transition-colors">
                          <div className="flex gap-4 flex-1 min-w-0">
                            <div className="mt-0.5 w-10 h-10 shrink-0 rounded-xl bg-red-500/10 flex items-center justify-center text-lg">📢</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="text-sm font-black text-white">{a.title}</h4>
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-neutral-800 text-neutral-400">
                                  {a.targetRoles?.join(', ') || 'All'}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-400 leading-relaxed mb-1.5">{a.message}</p>
                              <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                                {new Date(a.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete this announcement?')) {
                                try {
                                  await apiRequest(`/api/announcements/${a._id}`, { method: 'DELETE' });
                                  setAnnouncements(prev => prev.filter(x => x._id !== a._id));
                                } catch (err) {
                                  setError('Failed to delete announcement.');
                                }
                              }
                            }}
                            className="shrink-0 p-2 bg-neutral-800 hover:bg-red-900/40 text-red-500 rounded-lg border border-neutral-700 transition"
                            title="Delete Announcement"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'points' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-xl sm:text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                      <Coins className="text-red-500 w-8 h-8" />
                      Point System Management
                    </h1>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Configure automated rules and track global point activity.</p>
                  </div>
                  <button
                    onClick={() => {
                      setAwardPointsData({ memberId: '', points: 10, reason: '' });
                      setShowAwardPointsModal(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all flex items-center gap-2"
                  >
                    <Trophy size={16} />
                    Award Bonus Points
                  </button>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 mb-12">
                  {/* Automated Point Rules */}
                  <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 p-8">
                    <h3 className="text-sm font-black text-white mb-8 flex items-center gap-3 uppercase tracking-[0.2em]">
                      <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                      </div>
                      Automated Rules
                    </h3>
                    <div className="space-y-4">
                      {pointRules.map(rule => (
                        <div key={rule._id} className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-neutral-800 hover:border-red-500/30 transition-all group">
                          <div>
                            <p className="text-xs font-black text-white uppercase tracking-wider mb-1">{rule.action.replace('_', ' ')}</p>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{rule.description}</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-sm font-black text-red-500">+{rule.points} PTS</span>
                            <button
                              onClick={() => { setEditingPointRule(rule); setShowPointRuleModal(true); }}
                              className="w-10 h-10 flex items-center justify-center bg-neutral-800 text-neutral-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Point Logs */}
                  <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 p-8 flex flex-col">
                    <h3 className="text-sm font-black text-white mb-8 flex items-center gap-3 uppercase tracking-[0.2em]">
                      <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      Global Log
                    </h3>
                    <div className="space-y-4 overflow-y-auto max-h-[400px] pr-4 custom-scrollbar">
                      {pointHistory.map((log, idx) => (
                        <div key={log._id || idx} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-neutral-800/30">
                          <div>
                            <p className="text-xs font-bold text-neutral-200">{log.reason}</p>
                            <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-tight mt-1">
                              {new Date(log.createdAt).toLocaleString()} • {log.source}
                            </p>
                          </div>
                          <span className={`text-xs font-black px-3 py-1 rounded-lg ${log.points >= 0 ? 'bg-green-950/20 text-green-500' : 'bg-red-950/20 text-red-500'}`}>
                            {log.points >= 0 ? '+' : ''}{log.points}
                          </span>
                        </div>
                      ))}
                      {pointHistory.length === 0 && (
                        <div className="py-12 text-center border border-dashed border-neutral-800 rounded-2xl">
                          <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em]">Empty Transaction History</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-xl sm:text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                      <Trophy className="text-red-500 w-8 h-8" />
                      Achievement Milestones
                    </h1>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Define point thresholds and rewards for member growth.</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewMilestone({ title: '', pointsRequired: 100, rewardDescription: '', icon: '🌟', isActive: true });
                      setShowMilestoneModal(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    New Milestone
                  </button>
                </div>

                <div className="bg-neutral-900 rounded-xl shadow-lg border border-neutral-800 overflow-hidden">
                  <div className="p-6 border-b border-neutral-800 bg-black/20">
                    <h3 className="text-lg font-bold text-white">Milestone Thresholds</h3>
                  </div>
                  <table className="w-full">
                    <thead className="bg-black/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Icon &amp; Title</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Points Req</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Reward</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {milestones.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-12 text-center text-neutral-500 italic text-sm">No milestones found. Create one.</td></tr>
                      ) : (
                        milestones.map(m => (
                          <tr key={m._id} className="hover:bg-neutral-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{m.icon}</span>
                                <span className="text-sm font-bold text-white">{m.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-neutral-300 font-mono text-sm">{m.pointsRequired} pts</td>
                            <td className="px-6 py-4 text-neutral-400 text-sm">{m.rewardDescription || 'None'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${m.isActive ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                                {m.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => { setNewMilestone(m); setShowMilestoneModal(true); }} className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg border border-neutral-700 transition" title="Edit Milestone">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => handleDeleteMilestone(m._id)} className="p-2 bg-neutral-800 hover:bg-red-900/40 text-red-500 rounded-lg border border-neutral-700 transition" title="Delete Milestone">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-xl sm:text-3xl font-black text-white italic tracking-tighter uppercase">Notification History</h1>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Review your recent activity and system alerts.</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm("Mark all as read?")) {
                        await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
                        await loadData();
                      }
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-neutral-800 shadow-lg"
                  >
                    Mark All Read
                  </button>
                </div>

                <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden divide-y divide-neutral-800/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-black/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Source</th>
                          <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Notification Details</th>
                          <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Date &amp; Time</th>
                          <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/30">
                        {fullNotifications && fullNotifications.length > 0 ? (
                          fullNotifications.map((notif) => (
                            <tr key={notif._id} className={`transition-colors hover:bg-neutral-800/20 ${!notif.isRead ? 'bg-red-600/5' : ''}`}>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${notif.type === 'system' ? 'bg-red-900/30 text-red-500' :
                                  notif.type === 'membership' ? 'bg-neutral-800 text-neutral-400' :
                                    'bg-neutral-800 text-neutral-500'
                                  }`}>
                                  {notif.type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className={`text-sm font-bold ${!notif.isRead ? 'text-white' : 'text-neutral-400'}`}>{notif.title}</p>
                                <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{notif.message}</p>
                              </td>
                              <td className="px-6 py-4 text-xs font-mono text-neutral-500">
                                {new Date(notif.createdAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                {!notif.isRead ? (
                                  <button
                                    onClick={async () => {
                                      await apiRequest(`/api/notifications/${notif._id}/read`, { method: 'PATCH' });
                                      await loadData();
                                    }}
                                    className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-widest"
                                  >
                                    Mark Read
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    Read
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="4" className="px-6 py-12 text-center text-neutral-500 italic text-sm">No notification history found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-auto py-8 text-center text-neutral-600 text-sm border-t border-neutral-900">
          <p>&copy; 2026 Dharan Fitness Club. All rights reserved.</p>
        </footer>
      </div>

      {/* Standardized User Detail Modal */}
      <Modal
        isOpen={showUserDetailModal}
        onClose={() => setShowUserDetailModal(false)}
        title="User Profile Details"
      >
        {selectedUserDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-white font-bold">{selectedUserDetail.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-white font-bold text-sm break-all">{selectedUserDetail.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-white font-bold">{selectedUserDetail.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-sm font-black uppercase ${selectedUserDetail.isActive === false ? 'text-red-500' : 'text-green-500'}`}>
                    {selectedUserDetail.isActive === false ? 'Inactive' : 'Active'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Joined Date</p>
                  <p className="text-white font-bold">{new Date(selectedUserDetail.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedUserDetail.membershipType && (
                  <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Membership</p>
                    <p className="text-red-400 font-bold">{selectedUserDetail.membershipType}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setShowUserDetailModal(false)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Standardized Add Staff Modal */}
      <Modal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
        title="Add New Staff Member"
      >
        <form onSubmit={handleCreateStaff} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Full Name</label>
              <input
                type="text"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                placeholder="Enter staff name"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Email Address</label>
              <input
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                placeholder="staff@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Phone Number</label>
              <input
                type="tel"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                placeholder="98XXXXXXXX"
                required
              />
            </div>
            <div className="p-4 bg-black/50 rounded-xl border border-neutral-800">
              <p className="text-[10px] text-neutral-500 font-medium">Temporary password will be set to: <span className="text-red-400 font-bold">123456789</span>. Staff can change this after login.</p>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowAddStaffModal(false)}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Register Staff'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Standardized Broadcast Announcement Modal */}
      <Modal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        title="Broadcast New Announcement"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Message Title</label>
              <div className="relative">
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all pr-12"
                  placeholder="e.g. Holiday Schedule Update"
                  required
                />
                {newAnnouncement.isImportant && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 font-black animate-pulse">❗</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Broadcast Message</label>
              <textarea
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all min-h-[120px] resize-none"
                placeholder="Type your message here..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Target Audience</label>
                <select
                  value={newAnnouncement.targetRoles[0]}
                  onChange={(e) => {
                    const role = e.target.value;
                    const roles = role === 'ALL' ? ['MEMBER', 'STAFF'] : [role];
                    setNewAnnouncement({ ...newAnnouncement, targetRoles: roles });
                  }}
                  className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                >
                  <option value="MEMBER">Members Only</option>
                  <option value="STAFF">Staff Only</option>
                  <option value="ALL">Everyone (Members & Staff)</option>
                </select>
              </div>
              <div className="flex items-center justify-end h-full pt-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest group-hover:text-red-400 transition-colors">Mark as Important</span>
                  <div
                    onClick={() => setNewAnnouncement({ ...newAnnouncement, isImportant: !newAnnouncement.isImportant })}
                    className={`w-12 h-6 rounded-full transition-all relative ${newAnnouncement.isImportant ? 'bg-red-600' : 'bg-neutral-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newAnnouncement.isImportant ? 'left-7' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowAnnouncementModal(false)}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 rounded-xl transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-red-600/20"
            >
              {loading ? 'Sending...' : 'Send Broadcast'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Standardized Milestone Modal */}
      <Modal
        isOpen={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        title={newMilestone._id ? "Edit Milestone" : "Create New Milestone"}
      >
        <form onSubmit={handleSaveMilestone} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Icon (Emoji)</label>
              <input
                type="text"
                value={newMilestone.icon || ''}
                onChange={(e) => setNewMilestone({ ...newMilestone, icon: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                placeholder="e.g. 🌟"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Title</label>
              <input
                type="text"
                value={newMilestone.title || ''}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                placeholder="e.g. Active Beginner"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Points Required</label>
              <input
                type="number"
                value={newMilestone.pointsRequired || 0}
                onChange={(e) => setNewMilestone({ ...newMilestone, pointsRequired: Number(e.target.value) })}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Reward Description (Optional)</label>
              <input
                type="text"
                value={newMilestone.rewardDescription || ''}
                onChange={(e) => setNewMilestone({ ...newMilestone, rewardDescription: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                placeholder="e.g. Free Protein Drink"
              />
            </div>
            <div className="flex items-center gap-3 pt-2 justify-between">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest">Milestone Active</label>
              <div
                onClick={() => setNewMilestone({ ...newMilestone, isActive: !newMilestone.isActive })}
                className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${newMilestone.isActive ? 'bg-red-600' : 'bg-neutral-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newMilestone.isActive ? 'left-7' : 'left-1'}`} />
              </div>
            </div>
          </div>
          <div className="pt-4 flex gap-3 border-t border-neutral-800 mt-6">
            <button
              type="button"
              onClick={() => setShowMilestoneModal(false)}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Milestone'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showAwardPointsModal}
        onClose={() => setShowAwardPointsModal(false)}
        title="Manual Points Award"
      >
        <form onSubmit={handleAwardPoints} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Select Member</label>
              <select
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                value={awardPointsData.memberId}
                onChange={(e) => setAwardPointsData({ ...awardPointsData, memberId: e.target.value })}
                required
              >
                <option value="">-- Select Member --</option>
                {users.filter(u => u.role?.includes('MEMBER')).map(m => (
                  <option key={m._id} value={m._id} className="bg-neutral-900">{m.name} ({m.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Points to Award</label>
              <input
                type="number"
                value={awardPointsData.points}
                onChange={(e) => setAwardPointsData({ ...awardPointsData, points: Number(e.target.value) })}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Reason / Description</label>
              <textarea
                value={awardPointsData.reason}
                onChange={(e) => setAwardPointsData({ ...awardPointsData, reason: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all h-24 resize-none"
                placeholder="e.g. Participated in community event"
              />
            </div>
          </div>
          <div className="pt-4 flex gap-3 border-t border-neutral-800 mt-6">
            <button
              type="button"
              onClick={() => setShowAwardPointsModal(false)}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Awarding...' : 'Award Points'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Point Rule Edit Modal */}
      <Modal
        isOpen={showPointRuleModal}
        onClose={() => setShowPointRuleModal(false)}
        title="Configuration: Automated Point Rule"
      >
        {editingPointRule && (
          <form onSubmit={handleUpdatePointRule} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Action Trigger</label>
                <div className="bg-black/50 border border-neutral-800 rounded-xl p-3 text-neutral-400 font-mono text-sm">
                  {editingPointRule.action}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Points to Award</label>
                <input
                  type="number"
                  value={editingPointRule.points}
                  onChange={(e) => setEditingPointRule({ ...editingPointRule, points: Number(e.target.value) })}
                  className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 tracking-widest">Description</label>
                <input
                  type="text"
                  value={editingPointRule.description}
                  onChange={(e) => setEditingPointRule({ ...editingPointRule, description: e.target.value })}
                  className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-neutral-800">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Rule Active</label>
                <div
                  onClick={() => setEditingPointRule({ ...editingPointRule, isActive: !editingPointRule.isActive })}
                  className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${editingPointRule.isActive ? 'bg-red-600' : 'bg-neutral-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editingPointRule.isActive ? 'left-7' : 'left-1'}`} />
                </div>
              </div>
            </div>
            <div className="pt-4 flex gap-3 border-t border-neutral-800 mt-6">
              <button
                type="button"
                onClick={() => setShowPointRuleModal(false)}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Save Rule'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;