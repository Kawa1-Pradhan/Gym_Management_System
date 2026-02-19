import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('attendance');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [attendanceType, setAttendanceType] = useState('daily');
    const [sortConfig, setSortConfig] = useState({ key: 'revenue', direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [filters, setFilters] = useState({
        date: new Date().toLocaleDateString('en-CA'),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toLocaleDateString('en-CA'),
        endDate: new Date().toLocaleDateString('en-CA'),
        category: 'All'
    });

    // Data
    const [attendanceData, setAttendanceData] = useState([]);
    const [sessionData, setSessionData] = useState({ boxing: [], sauna: [], overall: [] });
    const [revenueData, setRevenueData] = useState({ details: [], summary: {}, transactionLogs: [] });
    const [topMembersData, setTopMembersData] = useState([]);

    useEffect(() => {
        fetchReportData();
    }, [activeTab, filters.date, filters.month, filters.year, filters.startDate, filters.endDate, attendanceType]);

    const fetchReportData = async () => {
        setLoading(true);
        setError('');
        try {
            if (activeTab === 'attendance') {
                if (attendanceType === 'daily') {
                    const data = await apiRequest(`/api/reports/attendance/daily?date=${filters.date}`);
                    setAttendanceData(data || []);
                } else {
                    const data = await apiRequest(`/api/reports/attendance/monthly?month=${filters.month}&year=${filters.year}`);
                    setAttendanceData(data || []);
                }
            } else if (activeTab === 'sessions') {
                const data = await apiRequest(`/api/reports/sessions?startDate=${filters.startDate}&endDate=${filters.endDate}`);
                setSessionData(data || { bookings: [], sessions: [], summary: {} });
            } else if (activeTab === 'revenue') {
                const data = await apiRequest(`/api/reports/revenue?startDate=${filters.startDate}&endDate=${filters.endDate}`);
                setRevenueData(data || { details: [], summary: {}, transactionLogs: [] });
            } else if (activeTab === 'members') {
                const data = await apiRequest('/api/reports/top-members?limit=10');
                setTopMembersData(data || []);
            }
        } catch (err) {
            setError('Failed to fetch report data. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = async () => {
        try {
            const doc = new jsPDF();

            // Branding & Design Tokens
            const RED_600 = [220, 38, 38];
            const SLATE_900 = [15, 23, 42];
            const SLATE_500 = [100, 116, 139];

            // Professional Header
            doc.setFillColor(...SLATE_900);
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.text("GYM ANALYTICS", 14, 25);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(200);
            const dateRange = activeTab === 'attendance'
                ? (attendanceType === 'daily' ? filters.date : `${filters.month}/${filters.year}`)
                : `${filters.startDate} to ${filters.endDate}`;

            doc.text(`REPORT TYPE: ${activeTab.toUpperCase()}`, 14, 32);
            doc.text(`PERIOD: ${dateRange}`, 14, 37);

            doc.setTextColor(255);
            doc.setFont("helvetica", "bold");
            doc.text(new Date().toLocaleDateString().toUpperCase(), 180, 32, { align: 'right' });

            let tableData = [];
            let columns = [];

            if (activeTab === 'attendance') {
                const searchLower = searchTerm.toLowerCase();
                const filtered = attendanceData.filter(d =>
                    (d.memberName?.toLowerCase().includes(searchLower) || d.name?.toLowerCase().includes(searchLower))
                );

                if (attendanceType === 'daily') {
                    columns = ["Member", "Plan", "Status", "Visits", "Time"];
                    tableData = filtered.map(d => [
                        String(d.memberName || 'Unknown'),
                        String(d.membershipType || 'N/A'),
                        String(d.memberStatus || 'N/A'),
                        String(d.totalPresenceCount || '0'),
                        d.checkInTime ? new Date(d.checkInTime).toLocaleTimeString() : 'N/A'
                    ]);
                } else {
                    columns = ["Member", "Attended", "Missed", "%"];
                    tableData = filtered.map(d => [
                        String(d.name || 'Unknown'),
                        String(d.daysAttended || '0'),
                        String(d.missedDays || '0'),
                        `${(d.attendancePercentage || 0).toFixed(1)}%`
                    ]);
                }
            } else if (activeTab === 'sessions') {
                const searchLower = searchTerm.toLowerCase();
                const filtered = (sessionData.bookings || []).filter(b =>
                    (b.memberName || '').toLowerCase().includes(searchLower) || (b.sessionName || '').toLowerCase().includes(searchLower)
                );
                columns = ["Member", "Type", "Session", "Date", "Status"];
                tableData = filtered.map(b => [
                    String(b.memberName || 'Unknown'),
                    String(b.sessionType || 'N/A'),
                    String(b.sessionName || 'N/A'),
                    b.date ? new Date(b.date).toLocaleDateString() : 'N/A',
                    String(b.status || 'N/A')
                ]);
            } else if (activeTab === 'revenue') {
                const filtered = (revenueData.details || []).filter(d =>
                    filters.category === 'All' || (d._id?.category || 'Gym') === filters.category
                );

                columns = ["Plan", "Category", "Qty", "Revenue", "%"];

                const reportTotalRev = filtered.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
                const overallTotalRev = revenueData.summary?.totalRevenue || 1;

                tableData = filtered.map(d => [
                    String(d.planName || 'Unknown'),
                    String(d._id?.category || 'Gym'),
                    String(d.count || '0'),
                    `Rs. ${(d.totalRevenue || 0).toLocaleString()}`,
                    `${(((d.totalRevenue || 0) / overallTotalRev) * 100).toFixed(1)}%`
                ]);

                // Add Summary Row
                tableData.push([
                    { content: 'TOTAL REVENUE', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
                    { content: `Rs. ${reportTotalRev.toLocaleString()}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
                    { content: filters.category === 'All' ? '100%' : `${((reportTotalRev / overallTotalRev) * 100).toFixed(1)}%`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }
                ]);
            } else if (activeTab === 'members') {
                columns = ["Rank", "Member Name", "Plan Type", "Visits"];
                tableData = topMembersData.map((m, i) => [
                    `#${i + 1}`,
                    String(m.name || 'Unknown'),
                    String(m.membershipType || 'N/A'),
                    String(m.attendanceCount || '0')
                ]);
            }

            autoTable(doc, {
                head: [columns],
                body: tableData,
                startY: 50,
                theme: 'grid',
                headStyles: {
                    fillColor: RED_600,
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 10,
                    cellPadding: 4
                },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    textColor: [50, 50, 50]
                },
                margin: { top: 50 }
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(...SLATE_500);
                doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
                doc.text("CONFIDENTIAL - FOR INTERNAL GYM MANAGEMENT USE ONLY", 14, 285);
            }

            const fileName = `Gym_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`;

            // ATTEMPT 1: Modern File System Access API (Forces Save As Dialog)
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(doc.output('blob'));
                    await writable.close();
                    console.log("PDF saved successfully using File System Access API."); // Debug log
                    return; // Success
                } catch (pickerErr) {
                    console.warn("User cancelled or Picker failed, falling back to direct download.", pickerErr);
                    // If user cancelled, we might not want to fallback, but let's do it anyway to be safe
                    if (pickerErr.name === 'AbortError') return;
                }
            }

            // ATTEMPT 2: Standard jsPDF Save (Browser decides based on settings)
            doc.save(fileName);

        } catch (err) {
            console.error("PDF Export failed:", err);
            setError("Failed to generate PDF. Please check your data and try again.");
        }
    };

    const toggleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const getSortedRevenue = () => {
        if (!revenueData.details) return [];
        return [...revenueData.details]
            .filter(d => filters.category === 'All' || (d._id.category || 'Gym') === filters.category)
            .sort((a, b) => {
                let valA, valB;
                if (sortConfig.key === 'plan') {
                    valA = a.planName;
                    valB = b.planName;
                    return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                } else if (sortConfig.key === 'purchases') {
                    valA = a.count;
                    valB = b.count;
                } else {
                    valA = a.totalRevenue;
                    valB = b.totalRevenue;
                }
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            });
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Reporting Analytics</h1>
                    <p className="text-slate-400 mt-1 font-medium">Detailed tracking and insights for your gym.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={exportToPDF}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        PDF Export
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 max-w-2xl">
                {['attendance', 'sessions', 'revenue', 'members'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Filters Section */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-wrap gap-6 items-end">
                {activeTab === 'attendance' && (
                    <div className="flex gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Report Type</label>
                            <select
                                value={attendanceType}
                                onChange={(e) => setAttendanceType(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="daily">Daily Attendance</option>
                                <option value="monthly">Monthly Summary</option>
                            </select>
                        </div>
                        {attendanceType === 'daily' ? (
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Select Date</label>
                                <input
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                    className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Month</label>
                                    <select
                                        value={filters.month}
                                        onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                                        className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Year</label>
                                    <input
                                        type="number"
                                        value={filters.year}
                                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                        className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold w-24"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {(activeTab === 'sessions' || activeTab === 'revenue') && (
                    <div className="flex gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'revenue' && (
                    <div className="flex gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                            <select
                                value={filters.category || 'All'}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="All">All Categories</option>
                                <option value="Gym">Gym Only</option>
                                <option value="Zumba">Zumba</option>
                                <option value="Cardio">Cardio</option>
                                <option value="Gym & Cardio">Gym & Cardio</option>
                            </select>
                        </div>
                    </div>
                )}
                {(activeTab === 'attendance' || activeTab === 'sessions') && (
                    <div className="flex-1 max-w-sm">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Search Member</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-white px-10 py-2 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Generating Insightful Data...</p>
                </div>
            ) : error ? (
                <div className="bg-red-900/40 border border-red-500/20 p-6 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-3 animate-in shake duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                </div>
            ) : (
                <div className="space-y-8">
                    {activeTab === 'attendance' && (
                        <div className="space-y-8">
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-8 py-6 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white">Member Attendance History</h3>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Showing {attendanceData.filter(d => (d.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) || d.name?.toLowerCase().includes(searchTerm.toLowerCase()))).length} Members
                                    </span>
                                </div>
                                <div className="max-h-[600px] overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-900/50 border-b border-slate-700 sticky top-0 z-10">
                                            <tr>
                                                {attendanceType === 'daily' ? (
                                                    <>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Member Name</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Visits</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Last Check-in</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Member Name</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attended</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Missed</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Percentage</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {attendanceData.filter(d => (d.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) || d.name?.toLowerCase().includes(searchTerm.toLowerCase()))).length === 0 ? (
                                                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">No matching records found.</td></tr>
                                            ) : attendanceData.filter(d => (d.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) || d.name?.toLowerCase().includes(searchTerm.toLowerCase()))).map((d, i) => (
                                                <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                                                    {attendanceType === 'daily' ? (
                                                        <>
                                                            <td className="px-6 py-4 text-xs font-medium text-slate-400">{new Date(d.date).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 text-xs font-bold text-white">{d.memberName}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${d.memberStatus === 'Active' ? 'bg-green-900/30 text-green-400 border border-green-500/20' : 'bg-red-900/30 text-red-500 border border-red-500/20'}`}>
                                                                    {d.memberStatus}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-black text-red-500 text-center">{d.totalPresenceCount}</td>
                                                            <td className="px-6 py-4 text-xs font-medium text-slate-500 text-right">{new Date(d.checkInTime).toLocaleTimeString()}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-6 py-4 text-xs font-bold text-white">{d.name}</td>
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-300">{d.daysAttended} days</td>
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{d.missedDays} days</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${d.attendancePercentage > 75 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-500'}`}>
                                                                    {d.attendancePercentage.toFixed(1)}%
                                                                </span>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div className="space-y-8">
                            {/* Session Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Bookings (Today)</h4>
                                    <p className="text-4xl font-black text-white">{sessionData.summary?.totalToday || 0}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2">Active participation today</p>
                                </div>
                                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Upcoming Sessions</h4>
                                    <p className="text-4xl font-black text-red-500">{sessionData.summary?.upcoming || 0}</p>
                                    <p className="text-[10px] font-bold text-red-400 mt-2 animate-pulse">Action required soon</p>
                                </div>
                                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Completed Sessions</h4>
                                    <p className="text-4xl font-black text-green-500">{sessionData.summary?.completed || 0}</p>
                                    <p className="text-[10px] font-bold text-green-400 mt-2">Successfully closed</p>
                                </div>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-8 py-6 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white">Detailed Participant Log</h3>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Showing {(sessionData.bookings || []).filter(b => b.memberName.toLowerCase().includes(searchTerm.toLowerCase())).length} Bookings
                                    </span>
                                </div>
                                <div className="max-h-[600px] overflow-y-auto font-sans">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-900/30 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Member Name</th>
                                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Type</th>
                                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Session Name</th>
                                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date & Time</th>
                                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {(sessionData.bookings || []).filter(b => b.memberName.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                                <tr><td colSpan="5" className="px-8 py-10 text-center text-slate-500 italic">No matching bookings found for this period.</td></tr>
                                            ) : (sessionData.bookings || []).filter(b => b.memberName.toLowerCase().includes(searchTerm.toLowerCase())).map((b, i) => (
                                                <tr key={i} className="hover:bg-slate-700/20 transition-colors group">
                                                    <td className="px-8 py-5 text-sm font-bold text-white">{b.memberName}</td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${b.sessionType === 'Boxing' ? 'bg-red-900/20 text-red-500 border border-red-500/20' : 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20'}`}>
                                                            {b.sessionType}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-xs text-slate-400 font-medium">{b.sessionName}</td>
                                                    <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                                                        {b.date ? new Date(b.date).toLocaleDateString() : 'N/A'} <span className="mx-2 opacity-30">|</span> {b.time}
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${b.status === 'Completed' ? 'bg-green-900/10 text-green-500 border-green-500/20' :
                                                            b.status === 'Cancelled' ? 'bg-slate-900/50 text-slate-500 border-slate-700' :
                                                                'bg-red-900/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                                            }`}>
                                                            {b.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-8 py-6 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span className="p-1.5 bg-red-600/20 text-red-500 rounded-lg">📊</span>
                                        Session Capacity & Performance
                                    </h3>
                                    <div className="flex gap-4 text-[10px] font-bold">
                                        <div className="flex items-center gap-1.5 text-red-500">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                            Low Bookings {'(<20%)'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-yellow-500">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                            Near Capacity {'(>90%)'}
                                        </div>
                                    </div>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto font-sans">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-900/30 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Session Name</th>
                                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Type</th>
                                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Capacity</th>
                                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Performance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {(sessionData.sessions || []).length === 0 ? (
                                                <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-500 italic">No session stats available for this period.</td></tr>
                                            ) : (sessionData.sessions || []).map((s, i) => {
                                                const fillPercentage = (s.bookedCount / (s.maxCapacity || 1)) * 100;
                                                const isLow = fillPercentage < 20 && s.status !== 'Cancelled';
                                                const isFull = fillPercentage > 90;

                                                return (
                                                    <tr key={i} className={`hover:bg-slate-700/20 transition-colors ${isLow ? 'bg-red-900/5' : isFull ? 'bg-yellow-900/5' : ''}`}>
                                                        <td className="px-8 py-5">
                                                            <div>
                                                                <p className="text-sm font-bold text-white">{s.name}</p>
                                                                <p className="text-[10px] text-slate-500">{new Date(s.date).toLocaleDateString()} | {s.time}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-slate-900 border border-slate-700 text-slate-400">
                                                                {s.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-center text-xs font-bold text-white">
                                                            {s.bookedCount} / {s.maxCapacity}
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            <div className="flex flex-col items-end gap-1.5">
                                                                <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full transition-all duration-1000 ${isLow ? 'bg-red-500' : isFull ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                        style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className={`text-[10px] font-black tracking-widest ${isLow ? 'text-red-500' : isFull ? 'text-yellow-500' : 'text-green-500'}`}>
                                                                    {fillPercentage.toFixed(0)}% OCCUPIED
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'revenue' && (
                        <div className="space-y-8">
                            {/* 3 Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                                    </div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">New Memberships</h4>
                                    <p className="text-4xl font-black text-white">{revenueData.summary?.totalNewMemberships || 0}</p>
                                    <p className="text-[10px] font-bold text-green-400 mt-2 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        Direct Acquisitions
                                    </p>
                                </div>
                                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                                    </div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Renewals</h4>
                                    <p className="text-4xl font-black text-white">{revenueData.summary?.totalRenewals || 0}</p>
                                    <p className="text-[10px] font-bold text-blue-400 mt-2 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                        Member Retention
                                    </p>
                                </div>
                                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Revenue</h4>
                                    <p className="text-4xl font-black text-red-500">Rs. {(revenueData.summary?.totalRevenue || 0).toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                        All Membership Sales
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Membership Card */}
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="px-8 py-6 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white">Membership Plan Details</h3>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex gap-4">
                                        <span>Total Plans: {revenueData.details?.length || 0}</span>
                                        <span>|</span>
                                        <span>Total Logs: {revenueData.transactionLogs?.length || 0}</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-900/30">
                                            <tr>
                                                <th
                                                    className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                                                    onClick={() => toggleSort('plan')}
                                                >
                                                    Plan Name {sortConfig.key === 'plan' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Category</th>
                                                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Members</th>
                                                <th
                                                    className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors"
                                                    onClick={() => toggleSort('purchases')}
                                                >
                                                    Purchases {sortConfig.key === 'purchases' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th
                                                    className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors"
                                                    onClick={() => toggleSort('revenue')}
                                                >
                                                    Revenue {sortConfig.key === 'revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {getSortedRevenue().map((plan, i) => {
                                                const members = revenueData.transactionLogs
                                                    ?.filter(t => t.planName === plan.planName)
                                                    .map(t => t.memberName)
                                                    .filter((v, idx, self) => self.indexOf(v) === idx)
                                                    .slice(0, 3);

                                                return (
                                                    <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                                                        <td className="px-8 py-5 text-sm font-bold text-white">{plan.planName}</td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-slate-400 font-bold uppercase">
                                                                {plan._id.category || 'Gym'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-xs text-slate-300 font-medium">{members?.join(', ') || 'N/A'}</p>
                                                                {revenueData.transactionLogs?.filter(t => t.planName === plan.planName).length > 3 && (
                                                                    <p className="text-[9px] text-slate-500 underline cursor-pointer">View All Members</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <div className="flex flex-col">
                                                                <span className="text-lg font-black text-white">{plan.count}</span>
                                                                <span className="text-[9px] font-bold text-slate-500 uppercase">{plan.newMembers} New | {plan.renewals} Renew</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-lg font-black text-red-500">Rs. {plan.totalRevenue.toLocaleString()}</span>
                                                                <span className="text-[9px] font-bold text-slate-600">
                                                                    {((plan.totalRevenue / (revenueData.summary?.totalRevenue || 1)) * 100).toFixed(1)}% of total
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
                                <h3 className="text-lg font-bold text-white">Top Active Members</h3>
                                {topMembersData.map((member, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700 hover:border-red-500 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-black text-slate-700 group-hover:text-red-500 transition-colors">#{i + 1}</span>
                                            <div>
                                                <p className="text-sm font-bold text-white">{member.name}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{member.membershipType}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-white">{member.attendanceCount}</p>
                                            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Visits Recorded</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-gradient-to-br from-red-900/40 to-slate-800 border border-red-500/20 p-8 rounded-2xl flex flex-col justify-center items-center text-center space-y-4">
                                <div className="bg-red-500/20 p-4 rounded-full">
                                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Member Retention Peak</h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs">
                                    The top members shown here have the highest engagement scores based on attendance frequency. Consider offering exclusive rewards to maintain this loyalty.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reports;
