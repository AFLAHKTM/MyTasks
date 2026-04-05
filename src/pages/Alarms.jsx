import React from 'react';
import { useAlarms } from '../lib/AlarmContext';
import { Bell, Trash2, Clock, Calendar, CheckCircle } from 'lucide-react';

export default function Alarms() {
    const { alarms, deleteAlarm, syncAlarmWithTask } = useAlarms();

    const activeAlarms = alarms.filter(a => a.status === 'active' || a.status === 'snoozed');
    const completedAlarms = alarms.filter(a => a.status === 'completed').slice(0, 10);

    return (
        <div className="page-container" style={{ maxWidth: '800px' }}>
            <div className="page-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Task Alarms</h1>
                </div>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                        const testDate = new Date();
                        testDate.setMinutes(testDate.getMinutes() + 1); // 1 minute from now
                        const mockTask = {
                            id: 'test-alarm-' + Date.now(),
                            title: 'Demo Test Alarm 🔔',
                            due_date: testDate.toISOString()
                        };
                        syncAlarmWithTask(mockTask);
                        alert('Test alarm scheduled for 1 minute from now! (Check the list below)');
                    }}
                >
                    Test System
                </button>
            </div>

            <div className="flex-col gap-4">
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <Bell size={20} color="var(--accent-primary)" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Active Alarms</h2>
                    </div>

                    {activeAlarms.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
                            <Clock size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p>No active alarms scheduled.</p>
                            <p style={{ fontSize: '0.8rem' }}>Set a due date and time on a task to create one.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {activeAlarms.map(alarm => (
                                <div key={alarm.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: alarm.status === 'snoozed' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ 
                                            width: '48px', height: '48px', borderRadius: '12px', 
                                            backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Bell size={24} className={alarm.status === 'snoozed' ? 'notif-ring' : ''} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{alarm.title}</h3>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Calendar size={14} /> {alarm.date}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                                    <Clock size={14} /> {alarm.time}
                                                </span>
                                                {alarm.status === 'snoozed' && (
                                                    <span style={{ color: 'var(--warning)', fontWeight: 600 }}> (SNOOZED)</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        className="btn btn-danger" 
                                        style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--danger)' }} 
                                        onClick={() => deleteAlarm(alarm.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section style={{ marginTop: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <CheckCircle size={20} color="var(--success)" />
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recently Triggered</h2>
                    </div>

                    <div className="table-container">
                        <table className="table">
                             <thead>
                                 <tr>
                                     <th>Alarm</th>
                                     <th>Triggered Date</th>
                                     <th>Status</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {completedAlarms.map(alarm => (
                                     <tr key={alarm.id}>
                                         <td>{alarm.title}</td>
                                         <td>{alarm.date} at {alarm.time}</td>
                                         <td><span className="badge badge-green">Triggered</span></td>
                                     </tr>
                                 ))}
                                 {completedAlarms.length === 0 && (
                                     <tr>
                                         <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>No history available.</td>
                                     </tr>
                                 )}
                             </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
