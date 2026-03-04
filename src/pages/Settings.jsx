import React, { useState, useEffect } from 'react';
import { getStatuses, saveStatuses, getTasks, updateTask, getPriorities, savePriorities } from '../lib/data';
import { Trash2, GripVertical } from 'lucide-react';

export default function Settings() {
    const [statuses, setStatuses] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [draggingStatusIndex, setDraggingStatusIndex] = useState(null);
    const [draggingPriorityIndex, setDraggingPriorityIndex] = useState(null);

    const [activeIntegrations, setActiveIntegrations] = useState([
        { name: 'Slack', description: 'Receive task updates and notifications in your channels.', connected: true, icon: '🔵' },
        { name: 'GitHub', description: 'Link commits and pull requests to your tasks.', connected: false, icon: '🐈' },
        { name: 'Google Calendar', description: 'Sync your tasks with deadlines to your calendar.', connected: false, icon: '📅' },
        { name: 'Notion', description: 'Embed tasks directly into your Notion workspace.', connected: false, icon: '📝' },
        { name: 'Jira', description: 'Two-way sync between mytask and Jira issues.', connected: false, icon: '🔷' },
        { name: 'Linear', description: 'Automatically create tasks from Linear tickets.', connected: false, icon: '🟣' },
        { name: 'Figma', description: 'Attach Figma designs directly to your tasks.', connected: false, icon: '🎨' },
        { name: 'Discord', description: 'Get notified of workspace activity in Discord.', connected: false, icon: '🎮' }
    ]);

    useEffect(() => {
        const handleDataSync = () => {
    setStatuses(getStatuses());
            setPriorities(getPriorities());
        };
        handleDataSync();
        window.addEventListener('appDataChanged', handleDataSync);
        window.addEventListener('storage', handleDataSync);
        return () => {
            window.removeEventListener('appDataChanged', handleDataSync);
            window.removeEventListener('storage', handleDataSync);
        };
    }, []);

    const onStatusDragStart = (e, index) => {
        setDraggingStatusIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
    };

    const onStatusDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onStatusDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggingStatusIndex === null || draggingStatusIndex === targetIndex) return;

        const newStatuses = [...statuses];
        const [draggedItem] = newStatuses.splice(draggingStatusIndex, 1);
        newStatuses.splice(targetIndex, 0, draggedItem);

        handleSaveStatuses(newStatuses);
        setDraggingStatusIndex(null);
    };

    const handleSaveStatuses = (newStatuses) => {
        setStatuses(newStatuses);
        saveStatuses(newStatuses);
    };

    const handleAddStatus = () => {
        handleSaveStatuses([...statuses, { name: 'New Status', color: 'badge-gray' }]);
    };

    const handleUpdateStatusName = (index, newName) => {
        const oldName = statuses[index].name;
        const newStatuses = [...statuses];
        newStatuses[index] = { ...newStatuses[index], name: newName };
        handleSaveStatuses(newStatuses);
    };

    const handleStatusNameBlur = (oldName, newName) => {
        if (oldName !== newName && newName.trim() !== '') {
            const tasks = getTasks();
            tasks.forEach(t => {
                if (t.status === oldName) updateTask(t.id, { status: newName });
            });
        }
    };

    const handleUpdateStatusColor = (index, color) => {
        const newStatuses = [...statuses];
        newStatuses[index] = { ...newStatuses[index], color: color };
        handleSaveStatuses(newStatuses);
    };

    const handleDeleteStatus = (index) => {
        if (!confirm('Delete this status? Active tasks will be moved to No Status.')) return;
        const toDelete = statuses[index].name;
        const newStatuses = statuses.filter((_, i) => i !== index);
        handleSaveStatuses(newStatuses);

        const tasks = getTasks();
        tasks.forEach(t => {
            if (t.status === toDelete) updateTask(t.id, { status: '' });
        });
    };

    const onPriorityDragStart = (e, index) => {
        setDraggingPriorityIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
    };

    const onPriorityDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onPriorityDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggingPriorityIndex === null || draggingPriorityIndex === targetIndex) return;

        const newPriorities = [...priorities];
        const [draggedItem] = newPriorities.splice(draggingPriorityIndex, 1);
        newPriorities.splice(targetIndex, 0, draggedItem);

        handleSavePriorities(newPriorities);
        setDraggingPriorityIndex(null);
    };

    const handleSavePriorities = (newPriorities) => {
        setPriorities(newPriorities);
        savePriorities(newPriorities);
    };

    const handleAddPriority = () => {
        handleSavePriorities([...priorities, { name: 'New Priority', color: 'badge-gray' }]);
    };

    const handleUpdatePriorityName = (index, newName) => {
        const newPriorities = [...priorities];
        newPriorities[index] = { ...newPriorities[index], name: newName };
        handleSavePriorities(newPriorities);
    };

    const handlePriorityNameBlur = (oldName, newName) => {
        if (oldName !== newName && newName.trim() !== '') {
            const tasks = getTasks();
            tasks.forEach(t => {
                if (t.priority === oldName) updateTask(t.id, { priority: newName });
            });
        }
    };

    const handleUpdatePriorityColor = (index, color) => {
        const newPriorities = [...priorities];
        newPriorities[index] = { ...newPriorities[index], color: color };
        handleSavePriorities(newPriorities);
    };

    const handleDeletePriority = (index) => {
        if (!confirm('Delete this priority? Active tasks will be moved to No priority.')) return;
        const toDelete = priorities[index].name;
        const newPriorities = priorities.filter((_, i) => i !== index);
        handleSavePriorities(newPriorities);

        const tasks = getTasks();
        tasks.forEach(t => {
            if (t.priority === toDelete) updateTask(t.id, { priority: '' });
        });
    };

    const [activeTab, setActiveTab] = useState('Properties');

    const renderPropertiesTab = () => (
        <>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Property Customization</h2>

            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Status Pipeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {statuses.map((s, i) => (
                        <div
                            key={i}
                            draggable
                            onDragStart={(e) => onStatusDragStart(e, i)}
                            onDragOver={onStatusDragOver}
                            onDrop={(e) => onStatusDrop(e, i)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)', cursor: draggingStatusIndex === i ? 'grabbing' : 'grab', opacity: draggingStatusIndex === i ? 0.5 : 1 }}
                        >
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <GripVertical size={16} style={{ color: 'var(--text-tertiary)', cursor: 'grab' }} />
                                {s.name === '' ? (
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '0.125rem 0' }}>No Status (Default)</span>
                                ) : (
                                    <>
                                        <select value={s.color} onChange={e => handleUpdateStatusColor(i, e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                            <option value="badge-gray">Gray</option>
                                            <option value="badge-blue">Blue</option>
                                            <option value="badge-green">Green</option>
                                            <option value="badge-red">Red</option>
                                            <option value="badge-yellow">Yellow</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={s.name}
                                            onChange={e => handleUpdateStatusName(i, e.target.value)}
                                            onBlur={e => handleStatusNameBlur(getStatuses()[i]?.name || '', e.target.value)}
                                            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}
                                        />
                                    </>
                                )}
                            </div>
                            <button onClick={() => handleDeleteStatus(i)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button className="btn btn-secondary" style={{ width: 'fit-content', marginTop: '0.5rem' }} onClick={handleAddStatus}>+ Add Status Block</button>
                </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Priority Levels</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {priorities.map((p, i) => (
                        <div
                            key={i}
                            draggable
                            onDragStart={(e) => onPriorityDragStart(e, i)}
                            onDragOver={onPriorityDragOver}
                            onDrop={(e) => onPriorityDrop(e, i)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)', cursor: draggingPriorityIndex === i ? 'grabbing' : 'grab', opacity: draggingPriorityIndex === i ? 0.5 : 1 }}
                        >
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <GripVertical size={16} style={{ color: 'var(--text-tertiary)', cursor: 'grab' }} />
                                {p.name === '' ? (
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '0.125rem 0' }}>Empty (Default)</span>
                                ) : (
                                    <>
                                        <select value={p.color} onChange={e => handleUpdatePriorityColor(i, e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                            <option value="badge-gray">Gray</option>
                                            <option value="badge-blue">Blue</option>
                                            <option value="badge-green">Green</option>
                                            <option value="badge-red">Red</option>
                                            <option value="badge-yellow">Yellow</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={p.name}
                                            onChange={e => handleUpdatePriorityName(i, e.target.value)}
                                            onBlur={e => handlePriorityNameBlur(getPriorities()[i]?.name || '', e.target.value)}
                                            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}
                                        />
                                    </>
                                )}
                            </div>
                            <button onClick={() => handleDeletePriority(i)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button className="btn btn-secondary" style={{ width: 'fit-content', marginTop: '0.5rem' }} onClick={handleAddPriority}>+ Add Priority Block</button>
                </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Database Configuration</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        <input type="checkbox" defaultChecked readOnly style={{ width: '16px', height: '16px' }} /> Enable AI Assistant Module
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        <input type="checkbox" readOnly style={{ width: '16px', height: '16px' }} /> Auto-archive Done Tasks (Past 30 Days)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        <input type="checkbox" defaultChecked readOnly style={{ width: '16px', height: '16px' }} /> Sync Local System Clock
                    </label>
                </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={() => alert('Settings Saved!')}>Save Preferences</button>
            </div>
        </>
    );
    const renderNotificationsTab = () => {
        const [notificationsEnabled, setNotificationsEnabled] = useState(false);

        useEffect(() => {
            if (typeof window !== 'undefined' && 'Notification' in window) {
                setNotificationsEnabled(Notification.permission === 'granted');
            }
        }, []);

        const handleEnableNotifications = () => {
            if (!("Notification" in window)) {
                alert("This browser does not support desktop notifications.");
                return;
            }

            if (window.location.protocol === 'file:') {
                alert("⚠️ Browser Security Block: \n\nChrome/Edge does NOT allow real desktop notifications to pop out when opening files directly from your computer (file://...).\n\nPlease run the app via a local server (like npm run dev or Live Server) or upload it to a web host to see the desktop notification popup!");
            }

            if (Notification.permission === "granted") {
                try {
                    new Notification("mytask.ai", {
                        body: "Notifications are already enabled! 🎉",
                        icon: "/favicon.ico"
                    });
                } catch (e) {
                    alert("Notification triggered, but your browser blocked the visual popup (likely because you are viewing this via a local file:// path).");
                }
                return;
            }

            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    setNotificationsEnabled(true);
                    try {
                        new Notification("mytask.ai", {
                            body: "Desktop notifications have been successfully enabled! 🚀",
                            icon: "/favicon.ico"
                        });
                    } catch (e) {
                        alert("Permission granted! But the visual popup was blocked by your browser (likely because you are viewing this via a local file:// path).");
                    }
                }
            });
        };

        const handleDisableNotifications = () => {
            alert("To disable notifications, please change the site settings in your browser URL bar.");
        };

        return (
            <>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Desktop Notifications</h2>

                <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '50%', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '2rem' }}>🔔</span>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Windows / OS Notifications</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', lineHeight: 1.5 }}>
                            Get real-time alerts for incoming tasks, deadlines, and team updates directly on your computer's notification panel.
                        </p>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        <button
                            className={`btn ${notificationsEnabled ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={handleEnableNotifications}
                            disabled={notificationsEnabled}
                            style={{ padding: '0.5rem 1.5rem' }}
                        >
                            {notificationsEnabled ? 'Enabled ✅' : 'Enable Notifications'}
                        </button>

                        {notificationsEnabled && (
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (Notification.permission === 'granted') {
                                        new Notification("mytask.ai - Workspace Notification", {
                                            body: "You have 9 pending messages unread in mytask.ai. Click here to view.",
                                            icon: "/favicon.ico"
                                        });
                                    }
                                }}
                                style={{ padding: '0.5rem 1.5rem', background: 'var(--success)' }}
                            >
                                Test OS Notification 🔔
                            </button>
                        )}

                        {notificationsEnabled && (
                            <button
                                className="btn btn-secondary"
                                onClick={handleDisableNotifications}
                                style={{ padding: '0.5rem 1.5rem' }}
                            >
                                Disable
                            </button>
                        )}
                    </div>

                    {notificationsEnabled && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.5rem' }}>
                            Your browser currently allows desktop notifications.
                        </p>
                    )}
                </div>
            </>
        );

        const [integrationsState, setIntegrationsState] = useState([
            { name: 'Slack', description: 'Receive task updates and notifications in your channels.', connected: true, connecting: false, icon: '🔵' },
            { name: 'GitHub', description: 'Link commits and pull requests to your tasks.', connected: false, connecting: false, icon: '🐈' },
            { name: 'Google Calendar', description: 'Sync your tasks with deadlines to your calendar.', connected: false, connecting: false, icon: '📅' },
            { name: 'Notion', description: 'Embed tasks directly into your Notion workspace.', connected: false, connecting: false, icon: '📝' },
            { name: 'Jira', description: 'Two-way sync between mytask and Jira issues.', connected: false, connecting: false, icon: '🔷' },
            { name: 'Linear', description: 'Automatically create tasks from Linear tickets.', connected: false, connecting: false, icon: '🟣' },
            { name: 'Figma', description: 'Attach Figma designs directly to your tasks.', connected: false, connecting: false, icon: '🎨' },
            { name: 'Discord', description: 'Get notified of workspace activity in Discord.', connected: false, connecting: false, icon: '🎮' }
        ]);
        const [apiKeys, setApiKeys] = useState({});

        const renderIntegrationsTab = () => {
            const toggleIntegration = (index) => {
                const intState = integrationsState[index];
                if (intState.connected) {
                    // Instantly disconnect
                    setIntegrationsState(prev => {
                        const updated = [...prev];
                        updated[index] = { ...updated[index], connected: false };
                        return updated;
                    });
                } else {
                    // Simulate connecting state
                    setIntegrationsState(prev => {
                        const updated = [...prev];
                        updated[index] = { ...updated[index], connecting: true };
                        return updated;
                    });

                    setTimeout(() => {
                        setIntegrationsState(prev => {
                            const updated = [...prev];
                            updated[index] = { ...updated[index], connecting: false, connected: true };
                            return updated;
                        });
                    }, 1500);
                }
            };

            return (
                <>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Integrations</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {integrationsState.map((int, i) => (
                            <div key={i} style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                background: 'var(--bg-primary)',
                                opacity: int.connecting ? 0.7 : 1,
                                transition: 'opacity 0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ fontSize: '1.5rem', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        {int.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{int.name}</h3>
                                        {int.connected ?
                                            <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span> Connected</span> :
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Not Connected</span>
                                        }
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, flex: 1 }}>
                                    {int.description}
                                </p>

                                {!int.connected && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{int.name} API Key</label>
                                        <input
                                            type="password"
                                            placeholder="sk_test_..."
                                            value={apiKeys[int.name] || ''}
                                            onChange={(e) => setApiKeys({ ...apiKeys, [int.name]: e.target.value })}
                                            style={{
                                                width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none'
                                            }}
                                            disabled={int.connecting}
                                        />
                                    </div>
                                )}

                                <button
                                    className={`btn ${int.connected ? 'btn-secondary' : 'btn-primary'}`}
                                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
                                    onClick={() => toggleIntegration(i)}
                                    disabled={int.connecting}
                                >
                                    {int.connecting ? 'Connecting...' : (int.connected ? 'Disconnect' : 'Connect')}
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            );
        };

        const navItemStyle = (isActive) => ({
            padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', transition: 'all 0.15s',
            ...(isActive ? {
                backgroundColor: 'var(--bg-primary)', fontWeight: 500, color: 'var(--accent-primary)',
                border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)'
            } : { color: 'var(--text-secondary)' })
        });

        return (
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Workspace Settings</h1>
                        <p className="page-subtitle">Configure your database properties and UI defaults.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 3fr', gap: '3rem' }}>
                    <aside>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={navItemStyle(activeTab === 'Properties')} onClick={() => setActiveTab('Properties')}>Properties</div>
                            <div style={navItemStyle(activeTab === 'Notifications')} onClick={() => setActiveTab('Notifications')}>Notifications</div>
                            <div style={navItemStyle(activeTab === 'Integrations')} onClick={() => setActiveTab('Integrations')}>Integrations</div>
                        </nav>
                    </aside>

                    <main className="card">
                        {activeTab === 'Properties' && renderPropertiesTab()}
                        {activeTab === 'Notifications' && renderNotificationsTab()}
                        {activeTab === 'Integrations' && renderIntegrationsTab()}
                    </main>
                </div>
            </div>
        );
    }
} 
