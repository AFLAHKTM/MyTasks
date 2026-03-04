import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, Clock, Calendar } from 'lucide-react';
import { getTasks } from '../lib/data';

export default function BellNotification({ isCollapsed, alignRight }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);

    const loadNotifications = () => {
        const tasks = getTasks();
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let notifs = [];

        tasks.forEach(task => {
            if (task.status === 'Done') return;

            if (task.due_date) {
                const dueDate = new Date(task.due_date);
                dueDate.setHours(0, 0, 0, 0);

                if (dueDate < now) {
                    notifs.push({
                        id: `overdue-${task.id}`,
                        type: 'overdue',
                        title: 'Task Overdue!',
                        message: `"${task.title || 'Untitled'}" was due ${dueDate.toLocaleDateString()}`,
                        icon: <AlertCircle size={14} color="var(--danger)" />
                    });
                } else if (dueDate.getTime() === now.getTime()) {
                    notifs.push({
                        id: `today-${task.id}`,
                        type: 'today',
                        title: 'Due Today',
                        message: `"${task.title || 'Untitled'}" is due today.`,
                        icon: <Calendar size={14} color="var(--accent-primary)" />
                    });
                }
            }

            if (task.status === 'In progress') {
                notifs.push({
                    id: `progress-${task.id}`,
                    type: 'progress',
                    title: 'In Progress',
                    message: `"${task.title || 'Untitled'}" is currently active.`,
                    icon: <Clock size={14} color="var(--badge-blue-text)" />
                });
            }
        });

        // Add a generic welcome/working notification if empty
        if (notifs.length === 0) {
            notifs.push({
                id: 'system-ready',
                type: 'system',
                title: 'All caught up!',
                message: 'You have no urgent tasks. Great job!',
                icon: <Bell size={14} color="var(--success)" />
            });
        }

        setNotifications(notifs);

        // Native OS / Mobile Notification Panel Push
        try {
            // Keep a registry on the window object to track instantiated notifications
            if (!window.osNotificationRegistry) {
                window.osNotificationRegistry = {};
            }

            const urgentNotifs = notifs.filter(n => n.type === 'overdue' || n.type === 'today' || n.type === 'progress');

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === "granted") {
                const currentUrgentIds = new Set(urgentNotifs.map(n => n.id));

                // Create new persistent notifications for active tasks
                urgentNotifs.forEach(notif => {
                    if (!window.osNotificationRegistry[notif.id]) {
                        const notification = new Notification(notif.title, {
                            body: notif.message,
                            requireInteraction: true, // Specific requirement: stays in notification bar until task is no longer urgent/completed
                            icon: "/favicon.ico"
                        });

                        // Click behavior: focus window
                        notification.onclick = () => {
                            window.focus();
                            notification.close(); // Close on click if user acts on it
                        };

                        // Store reference to programmatically close it later
                        window.osNotificationRegistry[notif.id] = notification;
                    }
                });

                // Programmatically close any notifications that are no longer active/urgent (e.g. marked as Done)
                Object.keys(window.osNotificationRegistry).forEach(id => {
                    if (!currentUrgentIds.has(id)) {
                        if (window.osNotificationRegistry[id] && typeof window.osNotificationRegistry[id].close === 'function') {
                            window.osNotificationRegistry[id].close();
                        }
                        delete window.osNotificationRegistry[id];
                    }
                });
            }
        } catch (error) {
            console.warn("OS Push Notifications skipped or unsupported:", error);
        }
    };

    useEffect(() => {
        const handleDataSync = () => {
            loadNotifications();
        };
        handleDataSync();
        window.addEventListener('appDataChanged', handleDataSync);
        window.addEventListener('storage', handleDataSync);

        // Setup a rough click-outside listener
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('appDataChanged', handleDataSync);
            window.removeEventListener('storage', handleDataSync);
        };
    }, []);

    // Refresh notifications when opening
    const toggleDropdown = () => {
        if (!isOpen) {
            loadNotifications();
        }
        setIsOpen(!isOpen);

        try {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                const promise = Notification.requestPermission();
                if (promise && promise.then) {
                    promise.then(permission => {
                        if (permission === 'granted') {
                            new Notification("mytask Workspace", { body: "Push Notifications enabled successfully!" });
                        }
                    }).catch(() => { });
                }
            }
        } catch (e) {
            console.warn("Push permissions not requested:", e);
        }
    };

    const urgentCount = notifications.filter(n => n.type === 'overdue' || n.type === 'today').length;

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    padding: '0.4rem',
                    borderRadius: '50%',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    marginTop: isCollapsed ? '1rem' : '0'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
                <Bell size={18} />
                {urgentCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '10px',
                        height: '10px',
                        backgroundColor: 'var(--danger)',
                        borderRadius: '50%',
                        border: '2px solid var(--bg-primary)'
                    }}></div>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    left: alignRight ? 'auto' : (isCollapsed ? '100%' : '0'),
                    right: alignRight ? '-10px' : 'auto',
                    marginLeft: isCollapsed ? '10px' : '0',
                    width: alignRight ? 'calc(100vw - 40px)' : '300px',
                    maxWidth: alignRight ? '350px' : 'none',
                    maxHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                    zIndex: 2000,
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</h4>
                    </div>

                    <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="custom-scrollbar">
                        {notifications.map(notif => (
                            <div key={notif.id} style={{
                                padding: '0.75rem 1rem',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                gap: '0.75rem',
                                alignItems: 'flex-start',
                                transition: 'background-color 0.2s',
                                cursor: 'default'
                            }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{
                                    padding: '0.4rem',
                                    borderRadius: '50%',
                                    background: 'var(--bg-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    {notif.icon}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{notif.title}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{notif.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
