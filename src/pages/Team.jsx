import React, { useState, useEffect } from 'react';
import { getTasks } from '../lib/data';
import { NavLink } from 'react-router-dom';

export default function Team() {
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

    const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Team Workload</h1>
                    <p className="page-subtitle">View open tasks grouped by assignee.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {assignees.map(assignee => {
                    const userTasks = tasks.filter(t => t.assignee === assignee);
                    return (
                        <div key={assignee} className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                    {assignee.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{assignee}</h2>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{userTasks.length} Assigned Tasks</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {userTasks.map(task => (
                                    <NavLink key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', display: 'block', transition: 'border-color 0.2s', ':hover': { borderColor: 'var(--border-hover)' } }}>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{task.title || 'Untitled'}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                            <span style={{ color: task.status === 'Done' ? 'var(--success)' : 'var(--text-secondary)' }}>{task.status || 'No Status'}</span>
                                            <span style={{ color: 'var(--text-tertiary)' }}>{task.due_date ? new Date(task.due_date).toLocaleDateString() : ''}</span>
                                        </div>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {assignees.length === 0 && (
                    <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                        No assignees found in the tasks database. Add standard assignees to tasks for profiles to populate.
                    </div>
                )}
            </div>
        </div>
    );
}
