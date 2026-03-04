import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { getTasks } from '../lib/data';

export default function BellNotification({ isCollapsed, alignRight }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
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
                        icon: <AlertCircle size={18} color="var(--danger)" />,
                        bgColor: 'var(--card-red-bg)',
                        time: 'Overdue'
                    });
                } else if (dueDate.getTime() === now.getTime()) {
                    notifs.push({
                        id: `today-${task.id}`,
                        type: 'today',
                        title: 'Due Today',
                        message: `"${task.title || 'Untitled'}" is due today.`,
                        icon: <Calendar size={18} color="var(--accent-primary)" />,
                        bgColor: 'var(--card-blue-bg)',
                        time: 'Today'
                    });
                }
            }

            if (task.status === 'In progress') {
                notifs.push({
                    id: `progress-${task.id}`,
                    type: 'progress',
                    title: 'In Progress',
                    message: `"${task.title || 'Untitled'}" is currently active.`,
                    icon: <Clock size={18} color="var(--warning)" />,
                    bgColor: 'var(--card-yellow-bg)',
                    time: 'Active'
                });
            }
        });

        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => n.type === 'overdue' || n.type === 'today').length);

        // Native OS / Mobile Notification Panel Push
        try {
            if (!window.osNotificationRegistry) {
                window.osNotificationRegistry = {};
            }

            const urgentNotifs = notifs.filter(n => n.type === 'overdue' || n.type === 'today' || n.type === 'progress');

            // Dispatch custom in-app chrome toast for every urgent notif that hasn't alarmed yet.
            if (!window.chromeToastRegistry) {
                window.chromeToastRegistry = {};
            }
            urgentNotifs.forEach(notif => {
                if (!window.chromeToastRegistry[notif.id]) {
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('showChromeToast', {
                            detail: {
                                ...notif,
                                domain: (window.location.host && window.location.host !== '') ? window.location.host : 'mydailytasks.pages.dev'
                            }
                        }));
                    }
                    window.chromeToastRegistry[notif.id] = true;
                }
            });

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === "granted") {
                const currentUrgentIds = new Set(urgentNotifs.map(n => n.id));

                urgentNotifs.forEach(notif => {
                    if (!window.osNotificationRegistry[notif.id]) {
                        try {
                            const notification = new Notification(notif.title, {
                                body: notif.message,
                                requireInteraction: true,
                                icon: "/favicon.ico"
                            });

                            notification.onclick = () => {
                                window.focus();
                                notification.close();
                            };

                            window.osNotificationRegistry[notif.id] = notification;
                        } catch (err) {
                            if ('serviceWorker' in navigator) {
                                navigator.serviceWorker.ready.then(registration => {
                                    registration.showNotification(notif.title, {
                                        body: notif.message,
                                        requireInteraction: true,
                                        icon: "/favicon.ico",
                                        tag: notif.id
                                    });
                                });
                                window.osNotificationRegistry[notif.id] = true;
                            }
                        }
                    }
                });

                Object.keys(window.osNotificationRegistry).forEach(id => {
                    if (!currentUrgentIds.has(id)) {
                        const notifRef = window.osNotificationRegistry[id];
                        if (notifRef && typeof notifRef.close === 'function') {
                            notifRef.close();
                        } else if (notifRef === true && 'serviceWorker' in navigator) {
                            navigator.serviceWorker.ready.then(reg => {
                                reg.getNotifications({ tag: id }).then(activeNotifs => {
                                    activeNotifs.forEach(n => n.close());
                                });
                            });
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
        loadNotifications();
        const handleDataSync = () => loadNotifications();

        window.addEventListener('appDataChanged', handleDataSync);
        window.addEventListener('storage', handleDataSync);

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

    const toggleDropdown = () => {
        if (!isOpen) loadNotifications();
        setIsOpen(!isOpen);

        try {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                const promise = Notification.requestPermission();
                if (promise && promise.then) {
                    promise.then(permission => {
                        if (permission === 'granted') {
                            try {
                                new Notification("mytask Workspace", { body: "Push Notifications enabled successfully!" });
                            } catch (e) {
                                if ('serviceWorker' in navigator) {
                                    navigator.serviceWorker.ready.then(reg => {
                                        reg.showNotification("mytask Workspace", { body: "Push Notifications enabled successfully!" });
                                    });
                                }
                            }
                        }
                    }).catch(() => { });
                }
            }
        } catch (e) {
            console.warn("Push permissions not requested:", e);
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className={`notif-btn ${isOpen ? 'active' : ''}`}
                style={{ marginTop: isCollapsed ? '1rem' : '0' }}
            >
                <Bell size={20} className={unreadCount > 0 ? 'notif-ring' : ''} />
                {unreadCount > 0 && <div className="notif-indicator"></div>}
            </button>

            {isOpen && (
                <div
                    className={`notif-dropdown ${alignRight ? 'mobile-align-right' : ''}`}
                    style={{
                        left: alignRight ? 'auto' : (isCollapsed ? '100%' : '0'),
                        right: alignRight ? '-10px' : 'auto',
                        marginLeft: isCollapsed ? '10px' : '0',
                        width: alignRight ? '350px' : '320px',
                    }}
                >
                    <div className="notif-header">
                        <h4 className="notif-title">Notifications</h4>
                        {notifications.length > 0 && (
                            <span className="notif-count-badge">
                                {notifications.length} New
                            </span>
                        )}
                    </div>

                    <div className="notif-list custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div key={notif.id} className={`notif-item ${notif.type}`}>
                                    <div
                                        className="notif-icon-wrapper"
                                        style={{ background: notif.bgColor }}
                                    >
                                        {notif.icon}
                                    </div>
                                    <div className="notif-content">
                                        <div className="notif-item-header">
                                            <span className="notif-item-title">{notif.title}</span>
                                            <span className="notif-item-time">{notif.time}</span>
                                        </div>
                                        <span className="notif-item-message">{notif.message}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="notif-empty">
                                <div className="notif-empty-icon">
                                    <CheckCircle2 size={32} />
                                </div>
                                <div>
                                    <div className="notif-empty-title">All caught up!</div>
                                    <div className="notif-empty-message">You have no pending tasks or updates.</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
