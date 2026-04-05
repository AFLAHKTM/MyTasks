import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlarms } from '../lib/AlarmContext';
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
    
    // Local state for debouncing
    const [localTitle, setLocalTitle] = useState('');
    const [localAssignee, setLocalAssignee] = useState('');
    const [localContent, setLocalContent] = useState('');
    const [editingIdx, setEditingIdx] = useState(-1);
    const [editingText, setEditingText] = useState('');

    useEffect(() => {
        const handleDataSync = () => {
            const t = getTask(id);
            if (t) {
                setTask(t);
                setLocalTitle(t.title || '');
                setLocalAssignee(t.assignee || '');
                setLocalContent(t.content || '');
            }
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

    useEffect(() => {
        setEditingIdx(-1);
        setEditingText('');
    }, [id]);

    // Handle debounced updates for text fields
    useEffect(() => {
        if (!task) return;
        const timer = setTimeout(() => {
            if (localTitle !== task.title) updateTask(id, { title: localTitle });
        }, 500);
        return () => clearTimeout(timer);
    }, [localTitle, id]);

    useEffect(() => {
        if (!task) return;
        const timer = setTimeout(() => {
            if (localAssignee !== task.assignee) updateTask(id, { assignee: localAssignee });
        }, 500);
        return () => clearTimeout(timer);
    }, [localAssignee, id]);

    useEffect(() => {
        if (!task) return;
        const timer = setTimeout(() => {
            if (localContent !== task.content) updateTask(id, { content: localContent });
        }, 800);
        return () => clearTimeout(timer);
    }, [localContent, id]);

    if (!task) return <div style={{ padding: '2rem' }}>Loading...</div>;

    const { syncAlarmWithTask } = useAlarms();
    const handleUpdate = (field, value) => {
        const updated = updateTask(id, { [field]: value });
        setTask(updated);
        if (field === 'due_date' || field === 'status' || field === 'title') {
            syncAlarmWithTask(updated);
        }
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
                    value={localTitle}
                    onChange={e => setLocalTitle(e.target.value)}
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
                        <input type="text" value={localAssignee} onChange={e => setLocalAssignee(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem' }} placeholder="Empty" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Due Date</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <GlassDatePicker value={task.due_date} onChange={val => handleUpdate('due_date', val)} />
                            <button 
                                onClick={() => {
                                    const now = new Date();
                                    // Preserve time if already there
                                    if (task.due_date && task.due_date.includes('T')) {
                                        const oldTime = new Date(task.due_date);
                                        now.setHours(oldTime.getHours(), oldTime.getMinutes(), 0, 0);
                                    }
                                    handleUpdate('due_date', now.toISOString());
                                }}
                                style={{
                                    background: 'var(--accent-light)',
                                    color: 'var(--accent-primary)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.2rem 0.6rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                TODAY
                            </button>
                        </div>
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
                    <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Recurring Schedule</span>
                            <button 
                                onClick={() => {
                                    const next = (task.recurring_days || []).length === 7 ? [] : [0,1,2,3,4,5,6];
                                    handleUpdate('recurring_days', next);
                                    handleUpdate('every_day', next.length === 7);
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--accent-primary)',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                {(task.recurring_days || []).length === 7 ? 'Deselect All' : 'Select All Days'}
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => {
                                const isSelected = (task.recurring_days || []).includes(idx);
                                return (
                                    <button
                                        key={day}
                                        onClick={() => {
                                            const current = task.recurring_days || [];
                                            const next = isSelected 
                                                ? current.filter(d => d !== idx)
                                                : [...current, idx];
                                            handleUpdate('recurring_days', next);
                                            handleUpdate('every_day', next.length === 7);
                                        }}
                                        style={{
                                            flex: '1',
                                            padding: '0.5rem 0',
                                            borderRadius: '8px',
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            border: '1.5px solid',
                                            backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                                            borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                                            color: isSelected ? 'white' : 'var(--text-tertiary)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Description</h3>
                        {task.status === 'Notes' && <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>✨ NOTES TYPE ACTIVE</span>}
                    </div>
                    <textarea
                        value={localContent}
                        onChange={e => setLocalContent(e.target.value)}
                        className="input"
                        style={{ minHeight: '150px', resize: 'vertical', fontFamily: 'monospace', padding: '1rem', fontSize: '0.875rem', backgroundColor: 'var(--bg-secondary)', border: 'none', marginBottom: '1.5rem' }}
                        placeholder="Start typing general description..."
                    />
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <FileText size={18} color="var(--accent-primary)" />
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Notes Log</h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(task.notes || []).map((note, idx) => (
                            <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    <span>{new Date(note.timestamp).toLocaleString()}</span>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {editingIdx !== idx && (
                                            <button 
                                                onClick={() => {
                                                    setEditingIdx(idx);
                                                    setEditingText(note.text);
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0 }}
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => {
                                                const newNotes = [...task.notes];
                                                newNotes.splice(idx, 1);
                                                handleUpdate('notes', newNotes);
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                {editingIdx === idx ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <textarea 
                                            className="input" 
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            style={{ minHeight: '80px', fontSize: '0.875rem' }}
                                            autoFocus
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button 
                                                className="btn btn-primary"
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                                onClick={() => {
                                                    const newNotes = [...task.notes];
                                                    newNotes[idx].text = editingText;
                                                    handleUpdate('notes', newNotes);
                                                    setEditingIdx(-1);
                                                }}
                                            >
                                                Save
                                            </button>
                                            <button 
                                                className="btn btn-secondary"
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                                onClick={() => setEditingIdx(-1)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{note.text}</div>
                                )}
                            </div>
                        ))}
                        
                        <div style={{ marginTop: '0.5rem' }}>
                            <textarea
                                id="new-note-input"
                                className="input"
                                style={{ minHeight: '80px', fontSize: '0.875rem', marginBottom: '0.75rem' }}
                                placeholder="Add a new quick note..."
                            />
                            <button 
                                className="btn btn-secondary" 
                                style={{ fontSize: '0.875rem', padding: '0.4rem 1rem' }}
                                onClick={() => {
                                    const input = document.getElementById('new-note-input');
                                    if (input && input.value.trim()) {
                                        const newNotes = [...(task.notes || []), { text: input.value, timestamp: new Date().toISOString() }];
                                        handleUpdate('notes', newNotes);
                                        input.value = '';
                                    }
                                }}
                            >
                                + Add Note
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={16} /> Delete Task</button>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => {
                            updateTask(id, { title: localTitle, assignee: localAssignee, content: localContent });
                            navigate('/tasks');
                        }}
                    >
                        <Save size={16} /> Save and Close
                    </button>
                </div>
            </div>
        </div>
    );
}
