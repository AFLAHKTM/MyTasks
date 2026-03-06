import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { PlusSquare, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import BellNotification from './BellNotification';
import InstallAppBtn from './InstallAppBtn';
import SyncIndicator from './SyncIndicator';
import logo from '../assets/logo.png';

export default function MobileHeader() {
    const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        setIsDark(!isDark);
        localStorage.setItem('theme', newTheme);
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            setIsDark(savedTheme === 'dark');
        }
    }, []);

    return (
        <div className="mobile-header">
            <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <div style={{ width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.25rem' }}>My Own Task</span>
            </NavLink>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={toggleTheme}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <InstallAppBtn variant="icon" />
                <NavLink to="/create-task" style={{ color: 'var(--text-secondary)', display: 'flex' }} aria-label="Create Task">
                    <PlusSquare size={20} />
                </NavLink>
                <NavLink to="/settings" style={{ color: 'var(--text-secondary)', display: 'flex' }} aria-label="Settings">
                    <SettingsIcon size={20} />
                </NavLink>
                <BellNotification isCollapsed={false} alignRight={true} />
            </div>
        </div>
    );
}
