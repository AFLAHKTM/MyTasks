import React, { useState, useEffect } from 'react';
import { getNotes, saveNotes, getTasks } from '../lib/data';
import { StickyNote, Save, Trash2, FileText, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Notes() {
    const navigate = useNavigate();
    const [content, setContent] = useState(getNotes());
    const [lastSaved, setLastSaved] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [taskNotes, setTaskNotes] = useState([]);

    useEffect(() => {
        const handleDataSync = () => {
            if (!isTyping) {
                setContent(getNotes());
            }
            const allTasks = getTasks();
            const withNotes = allTasks.filter(t => (t.notes && t.notes.length > 0) || t.status === 'Notes');
            setTaskNotes(withNotes);
        };
        handleDataSync();
        window.addEventListener('appDataChanged', handleDataSync);
        return () => window.removeEventListener('appDataChanged', handleDataSync);
    }, [isTyping]);

    const handleSave = () => {
        saveNotes(content);
        setLastSaved(new Date());
    };

    const handleClear = () => {
        if (confirm('Clear all notes? This cannot be undone.')) {
            setContent('');
            saveNotes('');
            setLastSaved(new Date());
        }
    };

    // Auto-save logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (content !== getNotes()) {
                handleSave();
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [content]);

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)', paddingBottom: '1rem' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'var(--accent-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
                        <StickyNote size={24} />
                    </div>
                    <div>
                        <h1 className="page-title">Personal Notes</h1>
                        <p className="page-subtitle">A private space for your thoughts and quick jottings.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {lastSaved && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> Saved {format(lastSaved, 'h:mm:ss a')}
                        </span>
                    )}
                    <button className="btn btn-secondary" onClick={handleClear} title="Clear Notes">
                        <Trash2 size={18} />
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        <Save size={18} /> Save Now
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                {/* Task Notes Sidebar */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} /> TASK-SPECIFIC NOTES
                    </h3>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {taskNotes.length === 0 ? (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                No tasks with notes found. Use the "Notes" status or add a log entry to a task.
                            </div>
                        ) : (
                            taskNotes.map(task => (
                                <div 
                                    key={task.id} 
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                    style={{ 
                                        padding: '0.75rem', 
                                        borderRadius: 'var(--radius-md)', 
                                        backgroundColor: 'var(--bg-secondary)', 
                                        border: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    className="hover-card"
                                >
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {task.title || 'Untitled'}
                                        <ChevronRight size={14} style={{ opacity: 0.5 }} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                        {task.notes?.length || 0} log entries
                                    </div>
                                    {task.notes && task.notes.length > 0 && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            "{task.notes[task.notes.length - 1].text}"
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Workspace Note */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem', fontWeight: 500, backgroundColor: 'var(--bg-secondary)' }}>
                        <StickyNote size={14} /> workspace_notes.md
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            setIsTyping(true);
                            setTimeout(() => setIsTyping(false), 5000);
                        }}
                        placeholder="Start typing your thoughts here... (Works with Markdown)"
                        style={{
                            flex: 1,
                            width: '100%',
                            padding: '2rem',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '1.125rem',
                            lineHeight: '1.6',
                            fontFamily: 'inherit',
                            resize: 'none',
                            caretColor: 'var(--accent-primary)',
                            zIndex: 1
                        }}
                    />
                    
                    {/* Decorative Elements */}
                    <div style={{ 
                        position: 'absolute', 
                        top: '5rem', 
                        right: '2rem', 
                        width: '150px', 
                        height: '150px', 
                        background: 'var(--accent-primary)', 
                        filter: 'blur(100px)', 
                        opacity: 0.03, 
                        pointerEvents: 'none',
                        zIndex: 0 
                    }}></div>
                </div>
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                <p>Personal notes are securely synced to the cloud.</p>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <p>{content.length} characters | {content.split(/\s+/).filter(Boolean).length} words</p>
                    <p>{taskNotes.length} task-specific notebooks active</p>
                </div>
            </div>
        </div>
    );
}
