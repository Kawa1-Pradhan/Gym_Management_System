import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import InventoryComponent from '../components/InventoryComponent';
import Sidebar from '../components/Sidebar';
import Reports from './Reports';
import { Dumbbell, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
      <div
        className="bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
          <h2 className="text-lg font-bold text-white uppercase tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-all text-xl"
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

const StatCard = ({ title, value, color = 'blue', onClick }) => {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    cyan: 'text-cyan-400'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-slate-500 hover:shadow-slate-900/50 hover:translate-y-[-2px]' : ''}`}
    >
      <div className="flex flex-col">
        <p className="text-sm text-gray-400 mb-1 font-medium">{title}</p>
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
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${plan.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
          {plan.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-4 flex-grow">
        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Category Pricing</div>
        {categories.map((cat, idx) => (
          <div key={idx} className="space-y-1 pb-3 border-b border-slate-700/50 last:border-0">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">{cat.name}</span>
              <button
                onClick={() => handleToggleCategory(idx)}
                className={`text-[10px] px-2 py-0.5 rounded ${cat.isActive ? 'bg-cyan-900/40 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}
              >
                {cat.isActive ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs font-mono">Rs.</span>
              <input
                type="number"
                value={cat.price}
                onChange={(e) => handlePriceChange(idx, e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-sm focus:border-cyan-500 outline-none transition-colors"
                disabled={!cat.isActive}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 mt-4 border-t border-slate-700 flex justify-between items-center">
        <button
          onClick={() => onUpdate(plan._id, { isActive: !plan.isActive })}
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          {plan.isActive ? 'Disable Package' : 'Enable Package'}
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
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
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeBookings: 0,
    totalSessions: 0,
    staffMembers: 0
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

      // Fetch all data concurrently
      const [usersRes, bookingsRes, boxingRes, saunaRes, plansRes] = await Promise.all([
        apiRequest('/api/users'),
        apiRequest('/api/bookings'),
        apiRequest('/api/sessions/boxing'),
        apiRequest('/api/sessions/sauna'),
        apiRequest('/api/membership/plans')
      ]);

      const fetchedUsers = Array.isArray(usersRes) ? usersRes : [];
      const fetchedBookings = Array.isArray(bookingsRes) ? bookingsRes : [];
      const fetchedBoxing = Array.isArray(boxingRes) ? boxingRes : [];
      const fetchedSauna = Array.isArray(saunaRes) ? saunaRes : [];
      const fetchedPlans = Array.isArray(plansRes) ? plansRes : [];

      const fetchedSessions = [
        ...fetchedBoxing.map(s => ({ ...s, type: 'Boxing' })),
        ...fetchedSauna.map(s => ({ ...s, type: 'Sauna' }))
      ];

      // Update basic states
      setUsers(fetchedUsers);
      setBookings(fetchedBookings);
      setSessions(fetchedSessions);
      setPlans(fetchedPlans);

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
        const notifData = await apiRequest('/api/notifications?limit=20');
        setFullNotifications(notifData.notifications || []);
      } catch (err) {
        console.error('Error loading notification history:', err);
      }

      // Load announcements for the announcements tab
      try {
        const announcementsData = await apiRequest('/api/announcements');
        setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
      } catch (err) {
        console.error('Error loading announcements:', err);
      }

      // Calculate stats for overview
      const members = fetchedUsers.filter(u => u.role?.includes('MEMBER'));
      const activeMembers = members.filter(m => m.isActive !== false);
      const inactiveMembers = members.filter(m => m.isActive === false);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyRevenue = members
        .filter(m => {
          if (!m.membershipStartDate) return false;
          const startDate = new Date(m.membershipStartDate);
          return startDate >= firstDayOfMonth && startDate <= now;
        })
        .reduce((sum, m) => {
          const plan = fetchedPlans.find(p => p.name === m.membershipType);
          if (plan) {
            const finalPrice = plan.price - (plan.price * (plan.discountPercent || 0) / 100);
            return sum + finalPrice;
          }
          return sum;
        }, 0);

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const expiringSoon = members.filter(m => {
        if (!m.membershipExpiryDate) return false;
        const endDate = new Date(m.membershipExpiryDate);
        return endDate >= now && endDate <= sevenDaysFromNow;
      }).length;

      const planCounts = {};
      fetchedPlans.forEach(p => { planCounts[p.name] = 0; });
      members.forEach(m => {
        if (m.membershipType && m.membershipType !== 'None') {
          planCounts[m.membershipType] = (planCounts[m.membershipType] || 0) + 1;
        }
      });

      const planDistribution = Object.entries(planCounts).map(([name, count]) => ({
        name,
        count
      }));

      const today = new Date();
      const todayStr = today.toLocaleDateString('en-CA');
      const activeSessionsToday = fetchedSessions.filter(s => {
        if (!s || !s.date) return false;
        const sDate = new Date(s.date).toLocaleDateString('en-CA');
        return sDate === todayStr && s.status === 'Active';
      }).length;

      const newMembersThisMonth = members.filter(m => {
        if (!m.createdAt) return false;
        const createdDate = new Date(m.createdAt);
        return createdDate >= firstDayOfMonth && createdDate <= now;
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
        activeMembers: activeMembers.length,
        inactiveMembers: inactiveMembers.length,
        monthlyRevenue,
        expiringSoon,
        planDistribution,
        totalMembers: members.length,
        activeSessionsToday,
        newMembersThisMonth,
        mostBookedType,
        totalUsers: fetchedUsers.length,
        activeBookings: fetchedBookings.filter(b => b.status === 'Booked').length,
        totalSessions: fetchedSessions.length,
        staffMembers: fetchedUsers.filter(u => u.role?.includes('STAFF')).length
      });

    } catch (err) {
      console.error('Error in loadData:', err);
      setError('Failed to refresh data. Please try again.');
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
    { id: 'notifications', label: 'Notification Log' }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
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
        <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-30 px-4 sm:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="md:hidden flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Dumbbell className="text-white" size={18} />
              </div>
              <h1 className="text-white font-bold text-lg tracking-tight">GMS</h1>
            </div>

            {/* Desktop breadcrumb or title */}
            <div className="hidden md:block">
              <h2 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="opacity-50">Admin</span>
                <ChevronRight size={12} className="opacity-30" />
                <span className="text-white tracking-[0.2em]">{ADMIN_TABS.find(t => t.id === activeTab)?.label}</span>
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu />
              <button
                className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
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
            <div className="md:hidden border-t border-slate-700 mt-4 pt-4 pb-2 animate-in slide-in-from-top duration-300">
              <div className="space-y-1">
                {ADMIN_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
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
                <h1 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gradient bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Admin Dashboard</h1>

                <div className="mb-8">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Stats</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Members" value={stats.totalUsers || 0} color="blue" onClick={() => setActiveTab('members')} />
                    <StatCard title="Sessions Today" value={stats.activeSessionsToday || 0} color="purple" onClick={() => setActiveTab('sessions')} />
                    <StatCard title="New This Month" value={stats.newMembersThisMonth || 0} color="green" onClick={() => setActiveTab('members')} />
                    <StatCard title="Top Session" value={stats.mostBookedType || 'N/A'} color="orange" onClick={() => setActiveTab('sessions')} />
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Membership Metrics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Active Members" value={stats.activeMembers || 0} color="green" onClick={() => setActiveTab('members')} />
                    <StatCard title="Inactive Members" value={stats.inactiveMembers || 0} color="orange" onClick={() => setActiveTab('members')} />
                    <StatCard title="Monthly Revenue" value={`NPR ${(stats.monthlyRevenue || 0).toLocaleString()}`} color="blue" />
                    <StatCard title="Expiring Soon" value={stats.expiringSoon || 0} color="purple" onClick={() => setActiveTab('members')} />
                  </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 mb-8">
                  <h3 className="text-xl font-bold mb-6 text-white">Best-Selling Membership Plans</h3>
                  <div className="h-80 w-full">
                    {stats.planDistribution && stats.planDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.planDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} itemStyle={{ color: '#4ade80' }} cursor={{ stroke: '#334155', strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="count" stroke="#4ade80" strokeWidth={3} dot={{ fill: '#4ade80', r: 6 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 italic">No plan data available</div>
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
                    <p className="text-slate-500 text-xs mt-1">Manage gym membership accounts and status.</p>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-900/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">User Info</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Plan</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {users.filter(u => u.role?.includes('MEMBER') && !u.role?.some(r => ['ADMIN', 'STAFF'].includes(r))).map(u => (
                          <tr key={u._id} className="hover:bg-slate-700/30 cursor-pointer group transition-colors" onClick={() => { setSelectedUserDetail(u); setShowUserDetailModal(true); }}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{u.name}</div>
                              <div className="text-xs text-gray-500">{u.email}</div>
                              <div className="text-[10px] text-slate-500 mt-1">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-slate-300 font-medium">{u.membershipType || 'None'}</div>
                              {u.membershipExpiryDate && <div className="text-[10px] text-slate-500">Exp: {new Date(u.membershipExpiryDate).toLocaleDateString()}</div>}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${u.isActive === false ? 'text-red-500' : 'text-green-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.isActive === false ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
                                {u.isActive === false ? 'Inactive' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleUserAction(u._id, 'Reset Password')} className="p-2 bg-slate-700 hover:bg-slate-600 text-purple-400 rounded-lg border border-slate-600 transition" title="Reset Password">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                </button>
                                <button onClick={() => handleUserAction(u._id, u.isActive === false ? 'Activate' : 'Deactivate')} className={`p-2 rounded-lg border transition ${u.isActive === false ? 'bg-green-900/20 text-green-400 border-green-500/20' : 'bg-slate-700 hover:bg-red-900/20 text-orange-400 border-slate-600'}`} title="Toggle Status">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                </button>
                                <button onClick={() => handleUserAction(u._id, 'Delete')} className="p-2 bg-slate-700 hover:bg-red-900/40 text-red-500 rounded-lg border border-slate-600 transition" title="Delete User">
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
                    <p className="text-slate-500 text-xs mt-1">Manage system administrators and staff access.</p>
                  </div>
                  <button onClick={() => setShowAddStaffModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 rounded-md font-bold text-sm whitespace-nowrap shadow-lg transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Staff
                  </button>
                </div>

                <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-900/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">User Info</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Role</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {users.filter(u => u.role?.includes('STAFF') || u.role?.includes('ADMIN')).map(u => (
                          <tr key={u._id} className="hover:bg-slate-700/30 cursor-pointer group transition-colors" onClick={() => { setSelectedUserDetail(u); setShowUserDetailModal(true); }}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{u.name}</div>
                              <div className="text-xs text-gray-500">{u.email}</div>
                              <div className="text-[10px] text-slate-500 mt-1">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${u.role?.includes('ADMIN') ? 'bg-red-900/30 text-red-400 border border-red-500/20' : 'bg-violet-900/30 text-violet-400 border border-violet-500/20'}`}>
                                {u.role?.includes('ADMIN') ? 'Admin' : 'Staff'}
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
                                    <button onClick={() => handleUserAction(u._id, 'Reset Password')} className="p-2 bg-slate-700 hover:bg-slate-600 text-purple-400 rounded-lg border border-slate-600 transition" title="Reset Password">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                    </button>
                                    <button onClick={() => handleUserAction(u._id, u.isActive === false ? 'Activate' : 'Deactivate')} className={`p-2 rounded-lg border transition ${u.isActive === false ? 'bg-green-900/20 text-green-400 border-green-500/20' : 'bg-slate-700 hover:bg-red-900/20 text-orange-400 border-slate-600'}`} title="Toggle Status">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                    </button>
                                    <button onClick={() => handleUserAction(u._id, 'Delete')} className="p-2 bg-slate-700 hover:bg-red-900/40 text-red-500 rounded-lg border border-slate-600 transition" title="Delete User">
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
                <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-slate-700 bg-slate-700/30 font-bold">Active Reservations</div>
                  <div className="divide-y divide-slate-700">
                    {bookings.filter(b => b.status === "Booked").map(b => (
                      <div key={b._id} className="p-4 sm:p-6 flex flex-wrap justify-between items-center gap-2 hover:bg-slate-700/20">
                        <div>
                          <div className="font-bold text-white">{b.memberId?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-400">{b.sessionType} • {b.sessionDetails?.name}</div>
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
                    <div key={s._id} className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.type === "Boxing" ? "bg-red-900/50 text-red-400" : "bg-blue-900/50 text-blue-400"}`}>{s.type}</span>
                        <span className={`text-[10px] font-bold uppercase ${s.status === "Active" ? "text-green-500" : "text-red-500"}`}>{s.status}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{s.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">Capacity: {s.availableSlots} / {s.maxCapacity}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button onClick={async () => {
                          const n = prompt("New Max Capacity?", s.maxCapacity);
                          if (n) { await apiRequest(`/api/sessions/${s.type.toLowerCase()}/${s._id}`, { method: 'PUT', body: { maxCapacity: parseInt(n) } }); loadData(); }
                        }} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition">Capacity</button>
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
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Today's Check-ins</p>
                    <p className="text-3xl font-black text-white">{attendanceRecords.filter(r => new Date(r.date).toLocaleDateString() === new Date().toLocaleDateString()).length}</p>
                    <p className="text-[10px] text-green-500 mt-2 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Tracking Live
                    </p>
                  </div>

                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Weekly Avg</p>
                    <p className="text-3xl font-black text-violet-400">{(attendanceRecords.length / 7).toFixed(1)}</p>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium italic">Based on filtered data</p>
                  </div>

                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Peak Time</p>
                    <p className="text-3xl font-black text-cyan-400">06:00 PM</p>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium italic">Usually busiest hour</p>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Filter by Member</label>
                      <select value={attendanceFilters.memberId} onChange={(e) => setAttendanceFilters({ ...attendanceFilters, memberId: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 transition-colors">
                        <option value="">All Active Members</option>
                        {users.filter(u => u.role?.includes('MEMBER')).map(m => (<option key={m._id} value={m._id}>{m.name}</option>))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Filter by Date</label>
                      <input type="date" value={attendanceFilters.date} onChange={(e) => setAttendanceFilters({ ...attendanceFilters, date: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-red-500 transition-colors min-h-[44px]" />
                    </div>
                    <button onClick={() => setAttendanceFilters({ date: '', memberId: '' })} className="bg-slate-700 hover:bg-slate-600 px-6 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider">Reset</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-900/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Member Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Date & Time</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Marked By</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {attendanceRecords.length === 0 ? (
                          <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500 italic">No attendance records found for the selected criteria.</td></tr>
                        ) : (
                          attendanceRecords.map(r => (
                            <tr key={r._id} className="hover:bg-slate-700/20 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-white">{r.member?.name}</div>
                                <div className="text-[10px] text-slate-500">{r.member?.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-300 font-medium">{new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                <div className="text-[10px] text-slate-500">{new Date(r.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-md">{r.markedBy?.name || 'System'}</span>
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

                <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-slate-700 bg-slate-700/30 flex justify-between items-center">
                    <span className="font-bold uppercase tracking-widest text-xs text-slate-400">Broadcast History</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{announcements.length} sent</span>
                  </div>
                  <div className="divide-y divide-slate-700/60">
                    {announcements.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                        <p className="text-slate-500 italic text-sm">No announcements yet. Send your first broadcast above.</p>
                      </div>
                    ) : (
                      announcements.map(a => (
                        <div key={a._id} className="p-5 flex justify-between items-start gap-4 hover:bg-slate-700/20 transition-colors">
                          <div className="flex gap-4 flex-1 min-w-0">
                            <div className="mt-0.5 w-10 h-10 shrink-0 rounded-xl bg-red-500/10 flex items-center justify-center text-lg">📢</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="text-sm font-black text-white">{a.title}</h4>
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-slate-700 text-slate-400">
                                  {a.targetRoles?.join(', ') || 'All'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed mb-1.5">{a.message}</p>
                              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
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
                            className="shrink-0 p-2 bg-slate-700 hover:bg-red-900/40 text-red-500 rounded-lg border border-slate-600 transition"
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

            {activeTab === 'notifications' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-xl sm:text-3xl font-black text-white italic tracking-tighter uppercase">Notification History</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Review your recent activity and system alerts.</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm("Mark all as read?")) {
                        await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
                        await loadData();
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-slate-700 shadow-lg"
                  >
                    Mark All Read
                  </button>
                </div>

                <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden divide-y divide-slate-700/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900/50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Source</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Notification Details</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Date & Time</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {fullNotifications && fullNotifications.length > 0 ? (
                          fullNotifications.map((notif) => (
                            <tr key={notif._id} className={`transition-colors hover:bg-slate-700/20 ${!notif.isRead ? 'bg-red-600/5' : ''}`}>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${notif.type === 'system' ? 'bg-red-900/30 text-red-500' :
                                  notif.type === 'membership' ? 'bg-purple-900/30 text-purple-400' :
                                    'bg-slate-700 text-slate-400'
                                  }`}>
                                  {notif.type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className={`text-sm font-bold ${!notif.isRead ? 'text-white' : 'text-slate-400'}`}>{notif.title}</p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{notif.message}</p>
                              </td>
                              <td className="px-6 py-4 text-xs font-mono text-slate-400">
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
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    Read
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500 italic text-sm">No notification history found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-auto py-8 text-center text-gray-500 text-sm border-t border-slate-800">
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
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-white font-bold">{selectedUserDetail.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-white font-bold text-sm break-all">{selectedUserDetail.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-white font-bold">{selectedUserDetail.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-sm font-black uppercase ${selectedUserDetail.isActive === false ? 'text-red-500' : 'text-green-500'}`}>
                    {selectedUserDetail.isActive === false ? 'Inactive' : 'Active'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Joined Date</p>
                  <p className="text-white font-bold">{new Date(selectedUserDetail.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedUserDetail.membershipType && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Membership</p>
                    <p className="text-cyan-400 font-bold">{selectedUserDetail.membershipType}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setShowUserDetailModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all"
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
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Full Name</label>
              <input
                type="text"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                placeholder="Enter staff name"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Email Address</label>
              <input
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                placeholder="staff@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Phone Number</label>
              <input
                type="tel"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                placeholder="98XXXXXXXX"
                required
              />
            </div>
            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-medium">Temporary password will be set to: <span className="text-red-400 font-bold">123456789</span>. Staff can change this after login.</p>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowAddStaffModal(false)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
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
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Message Title</label>
              <div className="relative">
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all pr-12"
                  placeholder="e.g. Holiday Schedule Update"
                  required
                />
                {newAnnouncement.isImportant && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 font-black animate-pulse">❗</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Broadcast Message</label>
              <textarea
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all min-h-[120px] resize-none"
                placeholder="Type your message here..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Target Audience</label>
                <select
                  value={newAnnouncement.targetRoles[0]}
                  onChange={(e) => {
                    const role = e.target.value;
                    const roles = role === 'ALL' ? ['MEMBER', 'STAFF'] : [role];
                    setNewAnnouncement({ ...newAnnouncement, targetRoles: roles });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-all"
                >
                  <option value="MEMBER">Members Only</option>
                  <option value="STAFF">Staff Only</option>
                  <option value="ALL">Everyone (Members & Staff)</option>
                </select>
              </div>
              <div className="flex items-center justify-end h-full pt-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-red-400 transition-colors">Mark as Important</span>
                  <div
                    onClick={() => setNewAnnouncement({ ...newAnnouncement, isImportant: !newAnnouncement.isImportant })}
                    className={`w-12 h-6 rounded-full transition-all relative ${newAnnouncement.isImportant ? 'bg-red-600' : 'bg-slate-700'}`}
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
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
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
    </div>
  );
};

export default AdminDashboard;