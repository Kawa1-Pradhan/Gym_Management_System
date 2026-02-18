import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const EnrollMember = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'MEMBER',
        membershipStartDate: new Date().toISOString().split('T')[0]
    });
    const [plans, setPlans] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await apiRequest('/api/membership/plans');
            const fetchedPlans = Array.isArray(res) ? res : [];
            setPlans(fetchedPlans);
            if (fetchedPlans.length > 0) {
                setSelectedPlanId(fetchedPlans[0]._id);
                if (fetchedPlans[0].categories && fetchedPlans[0].categories.length > 0) {
                    setSelectedCategoryId(fetchedPlans[0].categories[0]._id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch plans");
        }
    };

    const handlePlanChange = (e) => {
        const planId = e.target.value;
        setSelectedPlanId(planId);
        const plan = plans.find(p => p._id === planId);
        if (plan && plan.categories && plan.categories.length > 0) {
            setSelectedCategoryId(plan.categories[0]._id);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const selectedPlan = plans.find(p => p._id === selectedPlanId);
            const selectedCategory = selectedPlan?.categories.find(c => c._id === selectedCategoryId);

            if (!selectedPlan && formData.role === 'MEMBER') throw new Error("Please select a valid plan for members");
            if (!selectedCategory && formData.role === 'MEMBER') throw new Error("Please select a valid category");

            let payload = { ...formData };

            if (formData.role === 'MEMBER' && selectedPlan && selectedCategory) {
                const startDate = new Date(formData.membershipStartDate);
                const expiryDate = new Date(startDate);
                expiryDate.setMonth(expiryDate.getMonth() + (selectedPlan.durationMonths || 1));

                payload = {
                    ...payload,
                    membershipStatus: 'Active',
                    membershipType: `${selectedPlan.name} (${selectedCategory.name})`,
                    membershipExpiryDate: expiryDate,
                    membershipStartDate: startDate
                };
            }

            const response = await apiRequest('/api/users', {
                method: 'POST',
                body: payload
            });

            setSuccess('Member enrolled successfully!');
            setTempPassword(response.tempPassword);
            setFormData({
                name: '',
                email: '',
                phone: '',
                role: 'MEMBER',
                membershipStartDate: new Date().toISOString().split('T')[0]
            });
        } catch (err) {
            setError(err.message || 'Failed to enroll member');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent text-center">
                    Enroll New Member
                </h1>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    {success && (
                        <div className="bg-green-500/10 border border-green-500 text-green-400 p-6 rounded-xl mb-8">
                            <p className="font-bold text-lg mb-2">{success}</p>
                            <p className="text-sm opacity-90 mb-2">An email has been sent to the member with their login credentials.</p>
                            <p className="text-sm opacity-90">Temporary Password: <span className="font-mono text-white text-base bg-slate-950 px-2 py-1 rounded">{tempPassword}</span></p>
                            <p className="text-xs mt-4 text-slate-400 italic">The member can now log in using these credentials. They are NOT required to change the password immediately.</p>
                        </div>
                    )}

                    {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                    placeholder="98XXXXXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Member Role</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                >
                                    <option value="MEMBER">Member</option>
                                    <option value="STAFF">Staff</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>

                        {formData.role === 'MEMBER' && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Duration Package</label>
                                    <select
                                        value={selectedPlanId}
                                        onChange={handlePlanChange}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                    >
                                        {plans.map(plan => (
                                            <option key={plan._id} value={plan._id}>
                                                {plan.name} ({plan.durationMonths} Months)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Category & Price</label>
                                    <select
                                        value={selectedCategoryId}
                                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                    >
                                        {plans.find(p => p._id === selectedPlanId)?.categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.name} - NPR {cat.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        name="membershipStartDate"
                                        value={formData.membershipStartDate}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? 'Enrolling...' : 'Enroll Member'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/staff-dashboard')}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all mt-4 border border-slate-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EnrollMember;
