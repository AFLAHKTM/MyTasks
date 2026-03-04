import React, { useState, useEffect } from 'react';
import { getTasks } from '../lib/data';
import { NavLink } from 'react-router-dom';
import { Activity, Plus, Calendar as CalendarIcon, ArrowRight, CheckCircle } from 'lucide-react';
import { isSameDay, format } from 'date-fns';

export default function Home() {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const handleDataSync = () => {
            setTasks(getTasks());
        };
        handleDataSync();
        window.addEventListener('appDataChanged', handleDataSync);
        window.addEventListener('storage', handleDataSync);
        return () => {
            window.removeEventListener('appDataChanged', handleDataSync);
            window.removeEventListener('storage', handleDataSync);
        };
    }, []);

    const todayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), new Date()) && t.status !== 'Done');
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Done').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="page-container" style={{ margin: '0 auto', width: '100%', maxWidth: '1000px', padding: '3rem 2rem' }}>
            <header className="page-header" style={{ marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '-0.025em' }}>Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, User</h1>
                    <p className="page-subtitle" style={{ fontSize: '1.125rem' }}>Here is your overview for {format(new Date(), 'EEEE, MMMM do')}.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <NavLink to="/dashboard" className="btn btn-secondary">Enter Workspace</NavLink>
                    <NavLink to="/create-task" className="btn btn-primary"><Plus size={18} /> Quick Add</NavLink>
                </div>
            </header>

            <div className="home-dashboard-grid">
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <CalendarIcon size={20} color="var(--accent-primary)" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Action Items (Today)</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {todayTasks.length === 0 ? (
                            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-hover)' }}>
                                <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 1rem opacity: 0.5' }} />
                                <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No pending tasks for today.</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Enjoy your free time!</p>
                            </div>
                        ) : (
                            todayTasks.map(task => (
                                <NavLink key={task.id} to={`/tasks/${task.id}`} className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s', textDecoration: 'none', ':hover': { transform: 'translateY(-2px)' } }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{task.title}</h3>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {task.assignee && <span>👤 {task.assignee}</span>}
                                            {task.priority === 'High' && <span style={{ color: 'var(--danger)', fontWeight: 500 }}>High Priority</span>}
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '50%' }}>
                                        <ArrowRight size={20} color="var(--accent-primary)" />
                                    </div>
                                </NavLink>
                            ))
                        )}
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <Activity size={20} color="var(--accent-primary)" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Performance</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--bg-secondary)" strokeWidth="16" />
                                <circle
                                    cx="80" cy="80" r="70" fill="none"
                                    stroke="var(--accent-primary)"
                                    strokeWidth="16"
                                    strokeDasharray={`${2 * Math.PI * 70}`}
                                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{progress}%</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', justifyContent: 'space-around' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{total}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Done</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>{completed}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Left</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--badge-blue-text)' }}>{total - completed}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
