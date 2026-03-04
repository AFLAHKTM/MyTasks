import React, { useState, useEffect } from 'react';
import { getTasks, updateTask, getStatuses } from '../lib/data';
import { useNavigate } from 'react-router-dom';

export default function Completed() {
    const [tasks, setTasks] = useState([]);
    const navigate = useNavigate();

    const [systemStatuses, setSystemStatuses] = useState([]);

    useEffect(() => {
        const handleDataSync = () => {
    setTasks(getTasks().filter(t => t.status === 'Done'));
            setSystemStatuses(getStatuses());
        };
        handleDataSync();
        window.addEventListener('appDataChanged', handleDataSync);
        window.addEventListener('storage', handleDataSync);
        return () => {
            window.removeEventListener('appDataChanged', handleDataSync);
            window.removeEventListener('storage', handleDataSync);
        };
    }, []);

    const Pill = ({ type, value }) => {
        if (!value) return null;
        let className = 'badge ';
        if (type === 'status') {
            const match = systemStatuses.find(s => s.name === value);
            className += match ? match.color : 'badge-gray';
        }
        if (type === 'priority') {
            if (value === 'High') className += 'badge-red';
            else className += 'badge-green';
        }
        return <span className={className}>{value}</span>;
    };

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">Completed Tasks</h1>
                    <p className="page-subtitle">Archive of all finished items.</p>
                </div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Task Name</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Due Date</th>
                            <th>Assignee</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No completed tasks yet. Finish some work to see it here!
                                </td>
                            </tr>
                        ) : tasks.map(task => (
                            <tr key={task.id}>
                                <td>
                                    <span style={{ cursor: 'pointer', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'line-through' }} onClick={() => navigate(`/tasks/${task.id}`)}>
                                        {task.title || 'Untitled'}
                                    </span>
                                </td>
                                <td>
                                    <Pill type="status" value={task.status} />
                                </td>
                                <td>
                                    <Pill type="priority" value={task.priority} />
                                </td>
                                <td>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : ''}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {task.assignee || '-'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
