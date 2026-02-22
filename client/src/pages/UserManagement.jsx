import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await apiRequest('/api/users');
            setUsers(response);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch users');
            setLoading(false);
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm("Are you sure you want to change this user's status?")) return;
        try {
            await apiRequest(`/api/users/${id}/deactivate`, {
                method: 'PATCH'
            });
            fetchUsers();
            if (selectedUser && selectedUser._id === id) {
                // Update modal if open
                setSelectedUser(prev => ({ ...prev, isActive: !prev.isActive }));
            }
        } catch (err) {
            alert('Failed to update user status');
        }
    };

    const handleResetPassword = async (id) => {
        if (!window.confirm("Generate a new random password and send it to the user's email?")) return;
        try {
            const response = await apiRequest(`/api/users/${id}/reset-password`, {
                method: 'POST'
            });
            alert(`Password reset successful. Temporary password: ${response.tempPassword}. This has also been sent to their email.`);
        } catch (err) {
            alert('Failed to reset password');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("WARNING: This will permanently delete the user and all their associated data. This action CANNOT be undone. Proceed?")) return;
        try {
            await apiRequest(`/api/users/${id}`, {
                method: 'DELETE'
            });
            fetchUsers();
            setShowModal(false);
        } catch (err) {
            alert(err.message || 'Failed to delete user');
        }
    };

    const openDetails = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const staffUsers = users.filter(u => u.role.some(r => ['ADMIN', 'STAFF'].includes(r)));
    const memberUsers = users.filter(u => u.role.includes('MEMBER') && !u.role.some(r => ['ADMIN', 'STAFF'].includes(r)));

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
    );

    const UserTable = ({ title, usersList, colorClass }) => (
        <div className="mb-12">
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${colorClass}`}>
                <span className="w-2 h-8 bg-current opacity-20 rounded-full"></span>
                {title} ({usersList.length})
            </h2>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700">
                                <th className="p-4 font-semibold text-slate-300 text-sm uppercase tracking-wider">User Info</th>
                                <th className="p-4 font-semibold text-slate-300 text-sm uppercase tracking-wider">Role</th>
                                <th className="p-4 font-semibold text-slate-300 text-sm uppercase tracking-wider">Status</th>
                                <th className="p-4 font-semibold text-slate-300 text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {usersList.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-slate-500 italic">No users found in this section.</td>
                                </tr>
                            ) : (
                                usersList.map((user) => (
                                    <tr
                                        key={user._id}
                                        className="border-b border-slate-800 hover:bg-slate-800/40 transition-all cursor-pointer group"
                                        onClick={() => openDetails(user)}
                                    >
                                        <td className="p-4">
                                            <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${user.role.includes('ADMIN') ? 'bg-violet-900/30 text-violet-400 border-violet-500/20' :
                                                    user.role.includes('STAFF') ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/20' :
                                                        'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                {user.role[0]}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                                                {user.isActive ? 'Active' : 'Deactivated'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleResetPassword(user._id)}
                                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-lg border border-slate-700 transition"
                                                    title="Reset Password"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivate(user._id)}
                                                    className={`p-2 rounded-lg border transition ${user.isActive ? 'bg-slate-800 hover:bg-red-900/20 text-orange-400 border-slate-700' : 'bg-green-900/20 text-green-400 border-green-500/20'}`}
                                                    title={user.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="p-2 bg-slate-800 hover:bg-red-900/40 text-red-500 rounded-lg border border-slate-700 transition"
                                                    title="Delete User"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent uppercase tracking-tighter">
                            User Management
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage system access, roles, and member accounts.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Users</p>
                            <p className="text-xl font-black text-white">{users.length}</p>
                        </div>
                    </div>
                </header>

                {error && <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 animate-in fade-in duration-300">{error}</div>}

                <UserTable
                    title="Staff & Administrators"
                    usersList={staffUsers}
                    colorClass="text-violet-400"
                />

                <UserTable
                    title="Gym Members"
                    usersList={memberUsers}
                    colorClass="text-cyan-400"
                />
            </div>

            {/* Detail Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
                        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">User Details</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Detailed View</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-full transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</p>
                                        <p className="text-lg font-bold text-white">{selectedUser.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</p>
                                        <p className="text-lg font-bold text-white break-all">{selectedUser.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Phone Number</p>
                                        <p className="text-lg font-bold text-white">{selectedUser.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">System Role</p>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${selectedUser.role.includes('ADMIN') ? 'bg-violet-900/30 text-violet-400 border-violet-500/20' :
                                                selectedUser.role.includes('STAFF') ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/20' :
                                                    'bg-slate-800 text-slate-400 border-slate-700'
                                            }`}>
                                            {selectedUser.role.join(', ')}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Account Status</p>
                                        <p className={`text-lg font-black uppercase ${selectedUser.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                            {selectedUser.isActive ? 'Active' : 'Deactivated'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Registration Date</p>
                                        <p className="text-lg font-bold text-white">
                                            {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-800 flex flex-wrap gap-4">
                                <button
                                    onClick={() => handleResetPassword(selectedUser._id)}
                                    className="flex-1 min-w-[150px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-indigo-900/20"
                                >
                                    Reset Password
                                </button>
                                <button
                                    onClick={() => handleDeactivate(selectedUser._id)}
                                    className={`flex-1 min-w-[150px] font-bold py-3 px-6 rounded-xl transition border shadow-lg ${selectedUser.isActive
                                            ? 'bg-slate-800 hover:bg-red-900/20 text-orange-400 border-slate-700'
                                            : 'bg-green-600 hover:bg-green-500 text-white border-green-500'
                                        }`}
                                >
                                    {selectedUser.isActive ? 'Deactivate Account' : 'Activate Account'}
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedUser._id)}
                                    className="w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-bold py-3 px-6 rounded-xl transition border border-red-500/20 active:scale-95"
                                >
                                    Permanently Delete User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
