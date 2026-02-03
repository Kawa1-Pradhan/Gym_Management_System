import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, API_BASE_URL } from '../utils/api';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [phone, setPhone] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData.id) {
            navigate('/login');
            return;
        }
        fetchUserData(userData.id);
    }, [navigate]);

    const fetchUserData = async (userId) => {
        try {
            const response = await apiRequest(`/api/users/${userId}`);
            setUser(response);
            setPhone(response.phone || '');
        } catch (err) {
            setError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await apiRequest(`/api/users/${user._id}`, {
                method: 'PUT',
                body: { phone }
            });
            setSuccess('Phone number updated successfully!');
            setUser(response);
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSaving(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await apiRequest('/api/users/upload-avatar', {
                method: 'POST',
                body: formData
            });
            setSuccess('Profile picture updated successfully!');
            setUser(response.user);
        } catch (err) {
            setError(err.message || 'Failed up upload image');
        } finally {
            setSaving(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await apiRequest('/api/users/change-password', {
                method: 'POST',
                body: {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }
            });
            setSuccess('Password updated successfully!');
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const role = user?.role?.[0] || 'MEMBER';
    const isMember = role === 'MEMBER';

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
                        <p className="text-gray-400 text-sm">Welcome, {user?.name}</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back
                    </button>
                </div>

                {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">{error}</div>}
                {success && <div className="bg-green-900/50 border border-green-500 text-green-200 p-4 rounded-lg mb-6">{success}</div>}

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Sidebar / Quick Info */}
                    <div className="space-y-6">
                        <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 text-center relative group">
                            <div className="w-32 h-32 mx-auto mb-4 relative">
                                {user?.profileImageUrls?.[0] ? (
                                    <img
                                        src={`${API_BASE_URL}${user.profileImageUrls[0]}`}
                                        alt={user.name}
                                        className="w-full h-full rounded-full object-cover border-4 border-slate-700 shadow-xl"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-red-600 rounded-full flex items-center justify-center text-4xl font-bold shadow-xl">
                                        {user?.name?.charAt(0)}
                                    </div>
                                )}

                                {isMember && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 bg-red-600 p-2 rounded-full border-2 border-slate-800 hover:bg-red-700 transition-colors shadow-lg"
                                        title="Change Profile Picture"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <h2 className="text-xl font-bold">{user?.name}</h2>
                            <p className="text-gray-400 text-sm">{user?.email}</p>
                            <div className="mt-4 inline-block px-3 py-1 rounded-full bg-slate-700 text-xs font-bold text-red-500 border border-red-500/20 uppercase tracking-wider">
                                {role}
                            </div>
                        </div>

                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Details Section */}
                        <section className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700">
                            <h3 className="text-xl font-bold mb-8 flex items-center gap-2 border-b border-slate-700 pb-4">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                Account Details
                            </h3>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Full Name</label>
                                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 text-gray-400 font-medium">
                                            {user?.name}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Email Address</label>
                                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 text-gray-400 font-medium">
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>

                                {isMember && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Membership Status</label>
                                            <div className={`bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 font-bold ${user.membershipStatus === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
                                                {user.membershipStatus}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Membership Expiry</label>
                                            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 text-gray-300 font-medium">
                                                {user.membershipExpiryDate ? new Date(user.membershipExpiryDate).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Phone Number</label>
                                    <form onSubmit={handleUpdateProfile} className="flex gap-3">
                                        <input
                                            type="tel"
                                            value={phone}
                                            disabled={!isMember || saving}
                                            readOnly={!isMember}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className={`flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 font-medium transition-all ${isMember ? 'text-white focus:outline-none focus:ring-2 focus:ring-red-600' : 'text-gray-500 cursor-not-allowed'}`}
                                            placeholder="Enter phone number"
                                        />
                                        {isMember && (
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 rounded-lg transition duration-300 disabled:opacity-50"
                                            >
                                                Update
                                            </button>
                                        )}
                                    </form>
                                    {!isMember && (
                                        <p className="text-[10px] text-gray-500 mt-2 italic">Note: Staff and Admin details are managed by system administrators.</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Security Section - Member Only */}
                        {isMember && (
                            <section className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-slate-700 pb-4">
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Security
                                </h3>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-white">Password</h4>
                                        <p className="text-gray-400 text-sm">Regularly updating your password keeps your account safe.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-6 rounded-lg transition duration-300 whitespace-nowrap"
                                    >
                                        Change Password
                                    </button>
                                </div>
                            </section>
                        )}

                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-800 w-full max-w-md rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-700/30">
                            <h2 className="text-xl font-bold text-white">Change Password</h2>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Current Password</label>
                                <input
                                    required
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
                                />
                            </div>
                            <div className="grid gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                                    <input
                                        required
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm New Password</label>
                                    <input
                                        required
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-lg transition duration-300">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-lg transition duration-300 disabled:opacity-50">
                                    {saving ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
