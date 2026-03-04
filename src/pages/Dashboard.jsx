import React, { useState, useEffect } from 'react';
import { getTasks } from '../lib/data';
import { NavLink } from 'react-router-dom';
import { Activity, Clock, Target, CheckCircle, ArrowRight } from 'lucide-react';
import { isSameDay, isPast, isFuture } from 'date-fns';

export default function Dashboard() {
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

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Done').length;
    const inProgress = tasks.filter(t => t.status === 'In progress').length;
    const notStarted = tasks.filter(t => t.status === 'Not started' || !t.status).length;

    const overdue = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== 'Done');
    const dueToday = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), new Date()) && t.status !== 'Done');

    const StatCard = ({ title, value, icon, color }) => (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: `${color}15`, color: color }}>
                {icon}
            </div>
            <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{value}</h3>
            </div>
        </div>
    );

    const handleGenerateReport = () => {
        const headers = "Task ID,Title,Status,Priority,Due Date,Assignee\n";
        const rows = tasks.map(t =>
            `${t.id},"${(t.title || 'Untitled').replace(/"/g, '""')}","${t.status || 'No Status'}","${t.priority || 'Empty'}","${t.due_date ? t.due_date.split('T')[0] : 'None'}","${(t.assignee || 'Unassigned').replace(/"/g, '""')}"`
        ).join("\n");

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Workspace_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard Overview</h1>
                    <p className="page-subtitle">Welcome back! Here's what's happening in your workspace.</p>
                </div>
                <NavLink to="/create-task" className="btn btn-primary">Create Task</NavLink>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard title="Total Tasks" value={total} icon={<Activity size={24} />} color="var(--accent-primary)" />
                <StatCard title="Completed" value={completed} icon={<CheckCircle size={24} />} color="var(--success)" />
                <StatCard title="In Progress" value={inProgress} icon={<Clock size={24} />} color="var(--badge-blue-text)" />
                <StatCard title="To Do" value={notStarted} icon={<Target size={24} />} color="var(--text-tertiary)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Priority Action Items</h2>

                    {overdue.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--danger)', fontWeight: 600, marginBottom: '0.5rem' }}>Overdue</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {overdue.slice(0, 3).map(task => (
                                    <NavLink key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--badge-red-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--badge-red-bg)', color: 'var(--text-primary)' }}>
                                        <span style={{ fontWeight: 500 }}>{task.title || 'Untitled'}</span>
                                        <ArrowRight size={16} color="var(--text-tertiary)" />
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Due Today</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {dueToday.length === 0 ? <p style={{ fontSize: '0.875rem' }}>No tasks due today.</p> : dueToday.slice(0, 3).map(task => (
                                <NavLink key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                    <span style={{ fontWeight: 500 }}>{task.title || 'Untitled'}</span>
                                    <ArrowRight size={16} color="var(--text-tertiary)" />
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '60%', background: 'var(--accent-primary)', filter: 'blur(40px)', opacity: 0.5, zIndex: 0, borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%', background: 'rgba(16, 185, 129, 0.8)', filter: 'blur(40px)', opacity: 0.3, zIndex: 0, borderRadius: '50%' }}></div>

                    <div className="card" style={{
                        position: 'relative',
                        zIndex: 1,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02))',
                        backdropFilter: 'blur(16px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(150%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)'
                    }}>
                        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>✨ Assistant Summary</h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', lineHeight: 1.6, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            You have <strong style={{ color: 'white' }}>{inProgress} active tasks</strong> currently in progress.
                            {overdue.length > 0 ? ` Note that ${overdue.length} task(s) are overdue and require immediate attention.` : ' You are completely caught up on past-due items!'}
                            <br /><br />
                            Based on your usual velocity, you are on track to meet this week's deadlines. Keep pushing!
                        </p>
                        <button
                            className="btn"
                            onClick={handleGenerateReport}
                            style={{
                                marginTop: '1.5rem',
                                background: 'rgba(255, 255, 255, 0.15)',
                                color: 'white',
                                width: '100%',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                transition: 'all 0.2s ease',
                                fontWeight: 600,
                                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                            }}
                        >
                            Generate Full Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
