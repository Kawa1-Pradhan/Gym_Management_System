import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        try {
            await apiRequest(`/api/users/${id}/deactivate`, {
                method: 'PATCH'
            });
            fetchUsers();
        } catch (err) {
            alert('Failed to update user status');
        }
    };

    const handleResetPassword = async (id) => {
        try {
            const response = await apiRequest(`/api/users/${id}/reset-password`, {
                method: 'POST'
            });
            alert(`Password reset successful. Temporary password: ${response.tempPassword}`);
        } catch (err) {
            alert('Failed to reset password');
        }
    };

    if (loading) return <div className="text-white p-8">Loading users...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                    User Management
                </h1>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">{error}</div>}

                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700">
                                <th className="p-4 font-semibold text-slate-300">Name</th>
                                <th className="p-4 font-semibold text-slate-300">Email</th>
                                <th className="p-4 font-semibold text-slate-300">Role</th>
                                <th className="p-4 font-semibold text-slate-300">Status</th>
                                <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">{user.name}</td>
                                    <td className="p-4 text-slate-400">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.role.includes('ADMIN') ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' :
                                            user.role.includes('STAFF') ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                                                'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                            }`}>
                                            {user.role[0]}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                            'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}>
                                            {user.isActive ? 'Active' : 'Deactivated'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleResetPassword(user._id)}
                                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition"
                                        >
                                            Reset Password
                                        </button>
                                        <button
                                            onClick={() => handleDeactivate(user._id)}
                                            className={`text-xs px-3 py-1 rounded transition ${user.isActive ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30' :
                                                'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
                                                }`}
                                        >
                                            {user.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
