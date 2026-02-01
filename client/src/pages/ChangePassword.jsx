import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            return setError('New passwords do not match');
        }

        if (formData.newPassword.length < 8) {
            return setError('Password must be at least 8 characters long');
        }

        setLoading(true);

        try {
            await apiRequest('/api/users/change-password', {
                method: 'POST',
                body: {
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                }
            });

            setSuccess('Password changed successfully! Redirecting...');

            // Update local storage user object
            const user = JSON.parse(localStorage.getItem('user'));
            user.mustChangePassword = false;
            localStorage.setItem('user', JSON.stringify(user));

            setTimeout(() => {
                const userRole = user.role;
                if (userRole && userRole.includes('ADMIN')) {
                    navigate('/admin-dashboard');
                } else if (userRole && userRole.includes('STAFF')) {
                    navigate('/staff-dashboard');
                } else {
                    navigate('/dashboard');
                }
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Change Password</h1>
                    <p className="text-gray-400">Please update your temporary password to continue.</p>
                </div>

                {error && (
                    <div className="bg-red-600 text-white p-3 rounded mb-4 text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-600 text-white p-3 rounded mb-4 text-center">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Current password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Min. 8 characters"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Repeat new password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-4 rounded-md transition duration-300"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
