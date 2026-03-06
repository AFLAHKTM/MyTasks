import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, updateTask, deleteTask, getStatuses, getPriorities } from '../lib/data';
import ReactMarkdown from 'react-markdown';
import { FileText, Save, ArrowLeft, Trash2 } from 'lucide-react';
import GlassDatePicker from '../components/GlassDatePicker';


export default function TaskDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [systemStatuses, setSystemStatuses] = useState([]);
    const [systemPriorities, setSystemPriorities] = useState([]);

    useEffect(() => {
        const handleDataSync = () => {
            const t = getTask(id);
            if (t) setTask(t);
            else navigate('/tasks');
            setSystemStatuses(getStatuses());
            setSystemPriorities(getPriorities());
        };
        handleDataSync();
        window.addEventListener('appDataChanged', handleDataSync);
        window.addEventListener('storage', handleDataSync);
        return () => {
            window.removeEventListener('appDataChanged', handleDataSync);
            window.removeEventListener('storage', handleDataSync);
        };
    }, [id, navigate]);

    if (!task) return <div style={{ padding: '2rem' }}>Loading...</div>;

    const handleUpdate = (field, value) => {
        const updated = updateTask(id, { [field]: value });
        setTask(updated);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this task completely?')) {
            deleteTask(id);
            navigate('/tasks');
        }
    };

    return (
        <div className="task-detail-container" style={{ width: '100%', padding: '0 1rem 2rem 0' }}>
            <button className="btn btn-secondary task-detail-close" style={{ marginBottom: '1.5rem', padding: '0.25rem 0.75rem', background: 'transparent', border: 'none', boxShadow: 'none', marginLeft: '-0.5rem' }} onClick={() => navigate('/tasks')}>
                <ArrowLeft size={16} /> Close Panel
            </button>

            <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
                <input
                    type="text"
                    value={task.title}
                    onChange={e => handleUpdate('title', e.target.value)}
                    className="task-detail-title"
                    style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', border: 'none', background: 'transparent', width: '100%', outline: 'none' }}
                    placeholder="Untitled Task"
                />

                <div className="task-detail-fields" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Status</span>
                        <select
                            value={task.status} onChange={e => handleUpdate('status', e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', fontWeight: 500, color: 'var(--accent-primary)', cursor: 'pointer' }}
                        >
                            {systemStatuses.map(s => (
                                <option key={s.name} value={s.name}>{s.name || 'No Status'}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Assignee</span>
                        <input type="text" value={task.assignee} onChange={e => handleUpdate('assignee', e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem' }} placeholder="Empty" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Due Date</span>
                        <GlassDatePicker value={task.due_date} onChange={val => handleUpdate('due_date', val)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Priority</span>
                        <select
                            value={task.priority} onChange={e => handleUpdate('priority', e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-primary)' }}
                        >
                            {systemPriorities.map(p => (
                                <option key={p.name} value={p.name}>{p.name || 'Empty'}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description</h3>
                    <textarea
                        value={task.content}
                        onChange={e => handleUpdate('content', e.target.value)}
                        className="input"
                        style={{ minHeight: '300px', resize: 'vertical', fontFamily: 'monospace', padding: '1rem', fontSize: '0.875rem', backgroundColor: 'var(--bg-secondary)', border: 'none' }}
                        placeholder="Start typing..."
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={16} /> Delete Task</button>
                    <button className="btn btn-primary" onClick={() => navigate('/tasks')}><Save size={16} /> Save Changes</button>
                </div>
            </div>
        </div>
    );
}
