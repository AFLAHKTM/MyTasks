import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, PlusSquare, Calendar, Users, Settings as SettingsIcon, Archive, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import BellNotification from './BellNotification';
import logo from '../assets/logo.png';

export default function Sidebar() {
    const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        setIsDark(!isDark);
        localStorage.setItem('theme', newTheme);
    };

    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

    const toggleSidebar = () => {
        const newVal = !isCollapsed;
        setIsCollapsed(newVal);
        localStorage.setItem('sidebar_collapsed', newVal);
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            setIsDark(savedTheme === 'dark');
        }
    }, []);

    const routes = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Tasks', path: '/tasks', icon: <CheckSquare size={18} /> },
        { name: 'Completed', path: '/completed', icon: <Archive size={18} /> },
        { name: 'Calendar', path: '/calendar', icon: <Calendar size={18} /> },
        { name: 'Team', path: '/team', icon: <Users size={18} /> },
    ];

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ transition: 'width 0.2s', width: isCollapsed ? '72px' : '250px' }}>
            <div className="sidebar-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', height: '72px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                        <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    {!isCollapsed && <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', whiteSpace: 'nowrap' }}>mytask</span>}
                </div>
                {!isCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BellNotification isCollapsed={false} />
                        <button onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}>
                            <ChevronLeft size={18} />
                        </button>
                    </div>
                )}
            </div>

            {isCollapsed && (
                <div className="sidebar-collapsed-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    <BellNotification isCollapsed={true} />
                    <button onClick={toggleSidebar} style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', padding: '0.5rem', width: '100%', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            <div className="sidebar-nav-container" style={{ padding: '1.5rem 1rem', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                {!isCollapsed && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', paddingLeft: '0.5rem', whiteSpace: 'nowrap' }}>
                        Workspace
                    </div>
                )}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {routes.map(r => (
                        <NavLink
                            key={r.path}
                            to={r.path}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                                textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden'
                            })}
                            onMouseEnter={(e) => { if (e.currentTarget.style.backgroundColor === 'transparent' || e.currentTarget.style.backgroundColor === '') e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                            onMouseLeave={(e) => { if (e.currentTarget.style.color !== 'var(--accent-primary)') e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <div style={{ flexShrink: 0, display: 'flex' }}>{r.icon}</div>
                            {!isCollapsed && r.name}
                        </NavLink>
                    ))}
                </nav>

                {!isCollapsed && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', paddingLeft: '0.5rem', marginTop: '2rem', whiteSpace: 'nowrap' }}>
                        Actions
                    </div>
                )}
                {isCollapsed && <div style={{ height: '2rem' }}></div>}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <NavLink
                        to="/create-task"
                        className="mobile-hidden"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                            textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden'
                        })}
                    >
                        <div style={{ flexShrink: 0, display: 'flex' }}><PlusSquare size={18} /></div>
                        {!isCollapsed && 'Create Task'}
                    </NavLink>
                    <NavLink
                        to="/settings"
                        className="mobile-hidden"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                            textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden'
                        })}
                    >
                        <div style={{ flexShrink: 0, display: 'flex' }}><SettingsIcon size={18} /></div>
                        {!isCollapsed && 'Settings'}
                    </NavLink>
                    <button
                        onClick={toggleTheme}
                        className="mobile-hidden"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                            border: 'none', background: 'transparent', textAlign: 'left',
                            fontFamily: 'inherit',
                            fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)',
                            cursor: 'pointer', transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <div style={{ flexShrink: 0, display: 'flex' }}>
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </div>
                        {!isCollapsed && (isDark ? 'Light Mode' : 'Dark Mode')}
                    </button>
                </nav>
            </div>

            <div className="sidebar-footer" style={{ display: 'none' }}>
                {/* Moved inside nav container for mobile access */}
            </div>
        </aside>
    );
}
