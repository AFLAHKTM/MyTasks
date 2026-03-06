import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Bell, MoreHorizontal, Plus } from 'lucide-react';

export default function MobileNav() {
    const location = useLocation();

    // In Monday.com: Home, My Work, Notifications, More
    const navItems = [
        { name: 'Home', path: '/', icon: <Home size={22} /> },
        { name: 'My Work', path: '/tasks', icon: <CheckSquare size={22} /> },
        { name: 'Inbox', path: '/dashboard', icon: <Bell size={22} /> }, // Using dashboard as proxy for notifications for now
        { name: 'More', path: '/settings', icon: <MoreHorizontal size={22} /> },
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
