import React, { useState, useEffect } from 'react';
import {
    Users,
    LayoutDashboard,
    CalendarCheck,
    Dumbbell,
    ClipboardList,
    Package,
    BarChart3,
    UserPlus,
    ChevronDown,
    ChevronRight,
    LogOut,
    Waves,
    Bell,
    Trophy,
    Coins
} from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange, role }) => {
    const [expandedSection, setExpandedSection] = useState(null);

    // Determine which section should be expanded based on activeTab
    useEffect(() => {
        if (['members', 'admin-staff'].includes(activeTab)) {
            setExpandedSection('user-management');
        } else if (['reports', 'attendance-reports', 'inventory-reports'].includes(activeTab)) {
            setExpandedSection('reports');
        } else if (['boxing', 'sauna'].includes(activeTab)) {
            setExpandedSection('sessions');
        }
    }, [activeTab]);

    const toggleSection = (section) => {
        setExpandedSection(prev => prev === section ? null : section);
        // Automatically switch to first child tab when expanding
        if (expandedSection !== section) {
            if (section === 'user-management') onTabChange('members');
            if (section === 'sessions' && role === 'STAFF') onTabChange('boxing');
        }
    };

    const NavItem = ({ id, label, icon: Icon, isSubItem = false, onClick, parentId }) => {
        const isActive = activeTab === id;

        return (
            <button
                onClick={onClick || (() => onTabChange(id))}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                    ? 'bg-red-500/10 text-red-500 font-bold border-l-4 border-red-600'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                    } ${isSubItem ? 'pl-10 py-1.5 text-xs' : 'text-base'}`}
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon size={isSubItem ? 16 : 20} className={isActive ? 'text-red-500' : 'text-neutral-500 group-hover:text-neutral-300'} />}
                    <span>{label}</span>
                </div>
            </button>
        );
    };

    const ParentItem = ({ id, label, icon: Icon, children, sectionId }) => {
        const isExpanded = expandedSection === sectionId;
        const isAnyChildActive = React.Children.toArray(children).some(
            child => child.props.id === activeTab
        );
        const isActive = isAnyChildActive || (activeTab === id && !isExpanded);

        return (
            <div className="space-y-1">
                <button
                    onClick={() => toggleSection(sectionId)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                        ? 'bg-red-500/10 text-red-500 font-bold border-l-4 border-red-600'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <Icon size={20} className={isActive ? 'text-red-500' : 'text-neutral-500 group-hover:text-neutral-300'} />
                        <span>{label}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {isExpanded && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="w-64 h-screen bg-gradient-to-b from-neutral-900 to-black border-r border-neutral-800 flex flex-col fixed left-0 top-0 z-40 shadow-2xl">
            {/* Logo Area */}
            <div className="p-6 border-b border-neutral-800/50">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-white font-black text-xl tracking-tight">DFC<span className="text-red-600"> </span></h1>
                    </div>
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-4 mb-2">Main Menu</div>

                <NavItem id="home" label="Dashboard" icon={LayoutDashboard} />
                {role === 'STAFF' && <NavItem id="enrollment" label="Enroll Member" icon={UserPlus} />}

                {role === 'ADMIN' && (
                    <ParentItem sectionId="user-management" label="User Management" icon={Users}>
                        <NavItem id="members" label="Members" isSubItem />
                        <NavItem id="admin-staff" label="Staff" isSubItem />
                    </ParentItem>
                )}

                <NavItem id="bookings" label={role === 'ADMIN' ? 'Bookings' : 'Member Booking'} icon={CalendarCheck} />

                {role === 'STAFF' ? (
                    <ParentItem sectionId="sessions" label="Sessions" icon={Dumbbell}>
                        <NavItem id="boxing" label="Boxing" icon={Dumbbell} isSubItem />
                        <NavItem id="sauna" label="Sauna" icon={Waves} isSubItem />
                    </ParentItem>
                ) : (
                    <NavItem id="sessions" label="Sessions" icon={Dumbbell} />
                )}

                <NavItem id="attendance" label="Attendance" icon={ClipboardList} />

                {role === 'ADMIN' && (
                    <NavItem id="plans" label="Membership Plans" icon={Package} />
                )}

                <NavItem id="inventory" label="Inventory" icon={Package} />

                <NavItem id="reports" label="Reports" icon={BarChart3} />

                <NavItem id="achievements" label="Achievements" icon={Trophy} />

                {role === 'ADMIN' && <NavItem id="points" label="Point System" icon={Coins} />}

                {role === 'ADMIN' && <NavItem id="announcements" label="Announcements" icon={Bell} />}
            </nav>

            {/* Footer / User Info could go here if needed, but UserMenu is in top bar usually */}
            <div className="p-4 border-t border-neutral-800/50 bg-black/20">
                <p className="text-neutral-500 text-[10px] text-center font-medium">© 2026 Dharan Fitness Club</p>
            </div>
        </aside>
    );
};

export default Sidebar;
