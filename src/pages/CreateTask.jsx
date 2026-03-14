import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTask, getStatuses, getPriorities } from '../lib/data';
import GlassDatePicker from '../components/GlassDatePicker';


export default function CreateTask() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '', assignee: '', due_date: new Date().toISOString().split('T')[0],
        priority: 'Low', status: 'Not started', content: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const newTask = createTask({
            ...formData,
            due_date: formData.due_date ? new Date(formData.due_date).toISOString() : ''
        });
        navigate(`/tasks/${newTask.id}`);
    };

    return (
        <div className="page-container" style={{ maxWidth: '800px' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">Create Task</h1>
                    <p className="page-subtitle">Add a new item to your primary workspace.</p>
                </div>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label className="label">Task Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <input
                            type="text" required className="input" style={{ fontSize: '1.125rem', padding: '0.75rem' }}
                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="What needs to be done?"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <label className="label">Assignee</label>
                            <input type="text" className="input" value={formData.assignee} onChange={e => setFormData({ ...formData, assignee: e.target.value })} placeholder="e.g. John Doe" />
                        </div>
                        <div>
                            <label className="label">Due Date</label>
                            <GlassDatePicker value={formData.due_date} onChange={val => setFormData({ ...formData, due_date: val })} />
                        </div>
                        <div>
                            <label className="label">Priority</label>
                            <select className="input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                {getPriorities().map(p => (
                                    <option key={p.name} value={p.name}>{p.name || 'Empty'}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select className="input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                {getStatuses().map(s => <option key={s.name} value={s.name}>{s.name || 'No Status'}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">Task Content (Markdown)</label>
                        <textarea
                            className="input" style={{ minHeight: '200px', resize: 'vertical', fontFamily: 'monospace' }}
                            value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}
                            placeholder="# Markdown is fully supported..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
