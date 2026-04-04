import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Calendar, MoreHorizontal, Plus, FileText } from 'lucide-react';

export default function MobileNav() {
    const location = useLocation();

    // In Monday.com: Home, My Work, Notifications, More
    const navItems = [
        { name: 'Home', path: '/', icon: <Home size={20} /> },
        { name: 'My Work', path: '/tasks', icon: <CheckSquare size={20} /> },
        { name: 'Notes', path: '/notes', icon: <FileText size={20} /> },
        { name: 'Calendar', path: '/calendar', icon: <Calendar size={20} /> },
        { name: 'Settings', path: '/settings', icon: <MoreHorizontal size={20} /> },
    ];

    return (
        <div className="mobile-nav-wrapper">
            {/* Floating Action Button */}
            <NavLink to="/create-task" className="mobile-fab">
                <Plus size={28} color="white" />
            </NavLink>

            {/* Bottom Taskbar */}
            <nav className="mobile-taskbar">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <div className="mobile-nav-icon">{item.icon}</div>
                            <span className="mobile-nav-label">{item.name}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}
