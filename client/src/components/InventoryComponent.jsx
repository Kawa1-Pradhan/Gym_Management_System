import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const InventoryComponent = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [showModal, setShowModal] = useState(false);
    const [showReduceModal, setShowReduceModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToReduce, setItemToReduce] = useState(null);
    const [reduceAmount, setReduceAmount] = useState(1);
    const [reports, setReports] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = ["Weights", "Machines", "Consumable", "Sauna", "Supplement", "Merchandise"];
    const allCategories = ['All', ...categories];

    const [formData, setFormData] = useState({
        name: '',
        category: 'Weights',
        quantity: 0,
        price: 0,
        lowStockThreshold: 5,
        description: ''
    });

    useEffect(() => {
        loadInventory();
        if (user.role?.includes('ADMIN')) {
            loadReports();
        }
    }, []);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const response = await apiRequest('/api/inventory');
            setItems(Array.isArray(response) ? response : []);
        } catch (err) {
            setError('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const loadReports = async () => {
        try {
            const response = await apiRequest('/api/inventory/reports');
            setReports(response);
        } catch (err) {
            console.error('Failed to load reports');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (editingItem) {
                await apiRequest(`/api/inventory/${editingItem._id}`, {
                    method: 'PUT',
                    body: formData
                });
                setSuccess('Item updated successfully!');
            } else {
                await apiRequest('/api/inventory', {
                    method: 'POST',
                    body: formData
                });
                setSuccess('Item added successfully!');
            }
            setShowModal(false);
            setEditingItem(null);
            setFormData({ name: '', category: 'Weights', quantity: 0, price: 0, lowStockThreshold: 5, description: '' });
            loadInventory();
            if (user.role?.includes('ADMIN')) loadReports();
        } catch (err) {
            setError(err.message || 'Action failed');
        } finally {
            setLoading(false);
        }
    };

    const handleReduceStock = async (e) => {
        e.preventDefault();
        if (!itemToReduce) return;
        setLoading(true);
        setError('');
        try {
            await apiRequest(`/api/inventory/${itemToReduce._id}/reduce`, {
                method: 'PATCH',
                body: { amount: Number(reduceAmount) }
            });
            setSuccess(`Stock updated: ${itemToReduce.name} reduced by ${reduceAmount}`);
            setShowReduceModal(false);
            setReduceAmount(1);
            loadInventory();
            if (user.role?.includes('ADMIN')) loadReports();
        } catch (err) {
            setError(err.message || 'Failed to update stock');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently remove this item?')) return;
        try {
            await apiRequest(`/api/inventory/${id}`, { method: 'DELETE' });
            setSuccess('Item removed successfully');
            loadInventory();
            if (user.role?.includes('ADMIN')) loadReports();
        } catch (err) {
            setError(err.message || 'Failed to delete');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            price: item.price,
            lowStockThreshold: item.lowStockThreshold,
            description: item.description || ''
        });
        setShowModal(true);
    };

    const filteredItems = items
        .filter(item => activeCategory === 'All' || item.category === activeCategory)
        .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
                    <p className="text-gray-400 mt-1">Track and manage gym equipment and supplies.</p>
                </div>

                {user.role?.includes('ADMIN') && (
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setFormData({ name: '', category: 'Weights', quantity: 0, price: 0, lowStockThreshold: 5, description: '' });
                            setShowModal(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-semibold transition duration-300 shadow-lg"
                    >
                        + Add New Item
                    </button>
                )}
            </div>

            {/* Admin Stats */}
            {user.role?.includes('ADMIN') && reports && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-neutral-900 p-6 rounded-lg shadow-lg text-center border border-neutral-800">
                        <div className="text-3xl font-bold text-white mb-1">{reports.totalItems}</div>
                        <p className="text-neutral-500 text-sm font-medium uppercase tracking-wider">Total Items</p>
                    </div>
                    <div className="bg-neutral-900 p-6 rounded-lg shadow-lg text-center border border-neutral-800">
                        <div className="text-3xl font-bold text-orange-400 mb-1">{reports.lowStockItems}</div>
                        <p className="text-neutral-500 text-sm font-medium uppercase tracking-wider">Low Stock</p>
                    </div>
                    <div className="bg-neutral-900 p-6 rounded-lg shadow-lg text-center border border-neutral-800">
                        <div className="text-3xl font-bold text-red-500 mb-1">{reports.outOfStockItems}</div>
                        <p className="text-neutral-500 text-sm font-medium uppercase tracking-wider">Out of Stock</p>
                    </div>
                    <div className="bg-neutral-900 p-6 rounded-lg shadow-lg text-center border border-neutral-800">
                        <div className="text-2xl font-bold text-green-400 mb-1 truncate">Rs. {reports.categoryBreakdown.reduce((sum, cat) => sum + (cat.totalValue || 0), 0).toLocaleString()}</div>
                        <p className="text-neutral-500 text-sm font-medium uppercase tracking-wider">Total Value</p>
                    </div>
                </div>
            )}

            {/* Filters & Search */}
            <div className="mb-8">
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
                    />
                    <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="flex bg-neutral-900 rounded-lg p-1 overflow-x-auto no-scrollbar border border-neutral-800">
                    {allCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`flex-1 min-w-[100px] py-3 px-4 rounded-md font-medium transition duration-300 text-sm ${activeCategory === cat ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Feedback Messages */}
            {error && <div className="bg-red-600 text-white p-4 rounded-lg mb-6 text-sm">{error}</div>}
            {success && <div className="bg-green-600 text-white p-4 rounded-lg mb-6 text-sm">{success}</div>}

            {/* Inventory Table */}
            <div className="bg-neutral-900 rounded-lg shadow-lg overflow-hidden border border-neutral-800">
                {loading ? (
                    <div className="py-20 text-center text-neutral-500">Loading inventory...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-black/50 border-b border-neutral-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Item</th>
                                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Category</th>
                                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Stock</th>
                                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Price</th>
                                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {filteredItems.length > 0 ? filteredItems.map((item) => (
                                    <tr key={item._id} className="hover:bg-neutral-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white">{item.name}</p>
                                            {item.description && <p className="text-neutral-500 text-xs truncate max-w-xs">{item.description}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-neutral-300 bg-neutral-800 px-2 py-1 rounded">{item.category}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${item.quantity <= item.lowStockThreshold ? 'text-red-500' : 'text-white'}`}>
                                                    {item.quantity}
                                                </span>
                                                {item.quantity <= item.lowStockThreshold && (
                                                    <span className="text-[10px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase">Low</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-green-400">Rs. {item.price?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setItemToReduce(item); setReduceAmount(1); setShowReduceModal(true); }}
                                                    className="text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                                >
                                                    {['Supplement', 'Merchandise', 'Consumable'].includes(item.category) ? 'Sold' : 'Used'}
                                                </button>
                                                {user.role?.includes('ADMIN') && (
                                                    <>
                                                        <button onClick={() => handleEdit(item)} className="p-1.5 text-neutral-400 hover:bg-neutral-700/30 rounded transition-all">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        <button onClick={() => handleDelete(item._id)} className="p-1.5 text-red-500 hover:bg-red-900/30 rounded transition-all">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-neutral-500 italic">No items found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-neutral-900 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden border border-neutral-800 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-black/30">
                            <h2 className="text-xl font-bold">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Item Name</label>
                                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black border border-neutral-800 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Description (Optional)</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black border border-neutral-800 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all h-20 resize-none font-medium" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Category</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-black border border-neutral-800 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium cursor-pointer">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Price (Rs.)</label>
                                    <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-black border border-neutral-800 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Current Stock</label>
                                    <input required type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} className="w-full bg-black border border-neutral-800 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Low Stock Alert</label>
                                    <input required type="number" value={formData.lowStockThreshold} onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })} className="w-full bg-black border border-neutral-800 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium" />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded transition duration-300">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition duration-300 disabled:opacity-50">{loading ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showReduceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-neutral-900 w-full max-w-sm rounded-lg shadow-2xl border border-neutral-800 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <h3 className="text-xl font-bold mb-2">Record Transaction</h3>
                            <p className="text-neutral-400 text-sm mb-6">Units of <span className="text-green-400 font-bold">{itemToReduce?.name}</span> {['Supplement', 'Merchandise', 'Consumable'].includes(itemToReduce?.category) ? 'Sold' : 'Used'}:</p>
                            <form onSubmit={handleReduceStock} className="space-y-6">
                                <div className="flex items-center justify-center gap-6">
                                    <button type="button" onClick={() => setReduceAmount(Math.max(1, reduceAmount - 1))} className="w-12 h-12 rounded bg-neutral-800 flex items-center justify-center text-2xl font-bold hover:bg-neutral-700 transition-colors">-</button>
                                    <input type="number" value={reduceAmount} onChange={(e) => setReduceAmount(Math.min(itemToReduce?.quantity, Math.max(1, Number(e.target.value))))} className="w-20 bg-black text-center text-3xl font-bold py-2 rounded border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-600" />
                                    <button type="button" onClick={() => setReduceAmount(Math.min(itemToReduce?.quantity, reduceAmount + 1))} className="w-12 h-12 rounded bg-neutral-800 flex items-center justify-center text-2xl font-bold hover:bg-neutral-700 transition-colors">+</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setShowReduceModal(false)} className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded transition-all shadow-md">Cancel</button>
                                    <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition-all shadow-md disabled:opacity-50">Confirm</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryComponent;
