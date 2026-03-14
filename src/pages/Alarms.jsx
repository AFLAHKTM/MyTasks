import React, { useState, useEffect } from 'react';
import { useAlarms } from '../lib/AlarmContext';
import { Plus, BellRing, Edit2, Trash2, Clock, CalendarDays, X, Bell } from 'lucide-react';

export default function Alarms() {
    const { alarms, addAlarm, updateAlarm, deleteAlarm } = useAlarms();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAlarm, setEditingAlarm] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        reminderMinutes: '0',
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleOpenForm = (alarm = null) => {
        if (alarm) {
            setEditingAlarm(alarm);
            setFormData({
                title: alarm.title,
                date: alarm.date,
                time: alarm.time,
                reminderMinutes: alarm.reminderMinutes.toString(),
            });
        } else {
            setEditingAlarm(null);
            setFormData({
                title: '',
                date: new Date().toISOString().split('T')[0],
                time: '12:00',
                reminderMinutes: '0',
            });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingAlarm(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const alarmData = {
                ...formData,
                reminderMinutes: parseInt(formData.reminderMinutes, 10),
                status: 'active'
            };

            if (editingAlarm) {
                await updateAlarm(editingAlarm.id, alarmData);
            } else {
                await addAlarm(alarmData);
            }
            handleCloseForm();
        } catch (err) {
            console.error('Failed to save alarm:', err);
            alert('Wait, something went wrong while saving. Please try again.');
        }
    };

    const toggleAlarmStatus = (alarm) => {
        const newStatus = alarm.status === 'active' ? 'completed' : 'active';
        updateAlarm(alarm.id, { status: newStatus });
    };

    // Calculate time remaining for active alarms
    const getCountdown = (alarm) => {
        if (alarm.status !== 'active' && alarm.status !== 'snoozed') return 'Inactive';
        
        // Use trigger_utc if it exists, otherwise fall back to old client logic
        let triggerTime;
        if (alarm.trigger_utc) {
            triggerTime = new Date(alarm.trigger_utc).getTime();
        } else {
            const alarmDateTime = new Date(`${alarm.date}T${alarm.time}`);
            triggerTime = alarmDateTime.getTime() - ((alarm.reminderMinutes || 0) * 60000);
        }
        
        if (alarm.status === 'snoozed' && alarm.snoozeUntil) {
            triggerTime = new Date(alarm.snoozeUntil).getTime();
        }
        
        const diffMs = triggerTime - currentDate.getTime();
        
        if (diffMs <= 0) return 'Passed / Triggering';
        
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h remaining`;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const activeAlarms = alarms.filter(a => a.status === 'active' || a.status === 'snoozed');
    const pastAlarms = alarms.filter(a => a.status === 'completed');

    return (
        <div className="page-container animation-fade-in" style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                        <BellRing className="text-primary" size={28} />
                        Alarm Dashboard
                    </h1>
                    <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Set reminders for your tasks</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenForm()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    <Plus size={18} /> New Alarm
                </button>
            </div>

            <div className="alarms-grid" style={{ display: 'grid', gap: '1.5rem' }}>
                {activeAlarms.length > 0 ? (
                    <div className="alarms-section">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Upcoming Alarms</h2>
                        <div className="alarms-list" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {activeAlarms.map(alarm => (
                                <div key={alarm.id} className="alarm-card" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                                    <div className="alarm-card-indicator" style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--success)' }}></div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, paddingRight: '2rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{alarm.title}</h3>
                                        
                                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                            <input type="checkbox" checked={true} onChange={() => toggleAlarmStatus(alarm)} style={{ opacity: 0, width: 0, height: 0 }} />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '1.5rem' }}>
                                            <Clock size={20} />
                                            {alarm.time}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            <CalendarDays size={16} />
                                            {new Date(alarm.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        {alarm.reminderMinutes > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                                <Bell size={16} />
                                                Remind me {alarm.reminderMinutes} minutes before
                                            </div>
                                        )}
                                        {alarm.status === 'snoozed' && (
                                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', width: 'fit-content', marginTop: '0.25rem' }}>
                                                Snoozed
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className="countdown" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                            {getCountdown(alarm)}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleOpenForm(alarm)} style={{ background: 'var(--bg-tertiary)', border: 'none', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-text-primary">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => deleteAlarm(alarm.id)} style={{ background: 'var(--danger-light)', border: 'none', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1rem text-primary' }}>
                            <BellRing size={32} color="var(--text-tertiary)" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No upconing alarms</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>You don't have any active alarms. Create one to be reminded of your important tasks.</p>
                        <button className="btn btn-primary" onClick={() => handleOpenForm()} style={{ padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                            Create your first alarm
                        </button>
                    </div>
                )}

                {pastAlarms.length > 0 && (
                    <div className="alarms-section" style={{ marginTop: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-tertiary)' }}>Past / Inactive Alarms</h2>
                        <div className="alarms-list" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', opacity: 0.7 }}>
                            {pastAlarms.map(alarm => (
                                <div key={alarm.id} className="alarm-card" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--border-color)', position: 'relative' }}>
                                    <div className="alarm-card-indicator" style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--text-tertiary)' }}></div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-secondary)', margin: 0, textDecoration: 'line-through' }}>{alarm.title}</h3>
                                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                            <input type="checkbox" checked={false} onChange={() => toggleAlarmStatus(alarm)} style={{ opacity: 0, width: 0, height: 0 }} />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            <Clock size={16} /> {alarm.time}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                            <CalendarDays size={14} /> {new Date(alarm.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button onClick={() => deleteAlarm(alarm.id)} style={{ background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Alarm Form Modal */}
            {isFormOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="modal-content animation-scale-up" style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{editingAlarm ? 'Edit Alarm' : 'Create Alarm'}</h2>
                            <button onClick={handleCloseForm} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '0.25rem' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Task / Reminder Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g. Submit quarterly report"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit' }}
                                />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        value={formData.time}
                                        onChange={e => setFormData({...formData, time: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit' }}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Reminder Before Alert</label>
                                <select 
                                    value={formData.reminderMinutes}
                                    onChange={e => setFormData({...formData, reminderMinutes: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit', cursor: 'pointer' }}
                                >
                                    <option value="0">At time of event</option>
                                    <option value="5">5 minutes before</option>
                                    <option value="10">10 minutes before</option>
                                    <option value="15">15 minutes before</option>
                                    <option value="30">30 minutes before</option>
                                    <option value="60">1 hour before</option>
                                </select>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" onClick={handleCloseForm} style={{ padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 500 }}>
                                    Cancel
                                </button>
                                <button type="submit" style={{ padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                    {editingAlarm ? 'Save Changes' : 'Create Alarm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
