import React, { useState, useEffect } from 'react';
import { getNotes, saveNotes, getTasks, updateTask } from '../lib/data';
import { StickyNote, Save, Trash2, FileText, Clock, ChevronRight, LayoutList } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Notes() {
    const navigate = useNavigate();
    const [content, setContent] = useState(getNotes());
    const [lastSaved, setLastSaved] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [taskNotes, setTaskNotes] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [editingIdx, setEditingIdx] = useState(-1);
    const [editingText, setEditingText] = useState('');
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        const handleDataSync = () => {
            if (!isTyping) {
                setContent(getNotes());
            }
            const allTasks = getTasks();
            const withNotes = allTasks.filter(t => (t.notes && t.notes.length > 0) || t.status === 'Notes');
            setTaskNotes(withNotes);
            
            if (selectedTask) {
                const updatedSelected = allTasks.find(t => t.id === selectedTask.id);
                if (updatedSelected) setSelectedTask(updatedSelected);
            }
        };
        handleDataSync();
        window.addEventListener('appDataChanged', handleDataSync);
        return () => window.removeEventListener('appDataChanged', handleDataSync);
    }, [isTyping, selectedTask?.id]);

    useEffect(() => {
        setEditingIdx(-1);
        setEditingText('');
    }, [selectedTask?.id]);

    const handleSave = () => {
        saveNotes(content);
        setLastSaved(new Date());
    };

    const handleUpdateTaskNote = (taskId, newNotes) => {
        const updated = updateTask(taskId, { notes: newNotes });
        if (updated) setSelectedTask(updated);
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
        <div className="page-container notes-page-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 4rem)', paddingBottom: '2.5rem' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'var(--accent-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
                        <StickyNote size={24} />
                    </div>
                    <div>
                        <h1 className="page-title">{selectedTask ? `Notes for: ${selectedTask.title}` : 'Personal Notes'}</h1>
                        <p className="page-subtitle">{selectedTask ? 'Viewing and adding logs to this specific task.' : 'A private space for your thoughts and quick jottings.'}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {selectedTask ? (
                        <button className="btn btn-secondary" onClick={() => setSelectedTask(null)}>
                            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to Workspace Notes
                        </button>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </div>

            <div className={`notes-grid ${selectedTask ? 'task-selected' : ''}`}>
                {/* Task Notes Sidebar */}
                <div className="card notes-sidebar" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <FileText size={16} /> TASK-SPECIFIC NOTES
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.25rem', border: 'none', background: 'transparent' }}
                                onClick={() => setIsCompact(!isCompact)}
                                title={isCompact ? "Comfortable View" : "Compact View"}
                            >
                                <LayoutList size={16} style={{ opacity: isCompact ? 1 : 0.5 }} />
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.25rem', border: 'none', background: 'transparent' }}
                                onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
                            >
                                <ChevronRight size={16} style={{ transform: isSidebarMinimized ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                            </button>
                        </div>
                    </div>
                    {!isSidebarMinimized && (
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className={isCompact ? 'compact-list' : ''}>
                        {taskNotes.length === 0 ? (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                No tasks with notes found. Use the "Notes" status or add a log entry to a task.
                            </div>
                        ) : (
                            taskNotes.map(task => (
                                <div 
                                    key={task.id} 
                                    onClick={() => setSelectedTask(task)}
                                    style={{ 
                                        padding: '0.75rem', 
                                        borderRadius: 'var(--radius-md)', 
                                        backgroundColor: selectedTask?.id === task.id ? 'var(--accent-light)' : 'var(--bg-secondary)', 
                                        border: selectedTask?.id === task.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    className="hover-card"
                                >
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: selectedTask?.id === task.id ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {task.title || 'Untitled'}
                                        <ChevronRight size={14} style={{ opacity: 0.5 }} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                        {task.notes?.length || 0} log entries
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="card notes-editor" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    {selectedTask ? (
                        /* Task Log Interface */
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
                            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem', fontWeight: 500, backgroundColor: 'var(--bg-secondary)', margin: '-1.5rem -1.5rem 1.5rem -1.5rem' }}>
                                <FileText size={14} /> {selectedTask.title}_logs.txt
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                                {(selectedTask.notes || []).map((note, idx) => (
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
                                                        const newNotes = [...selectedTask.notes];
                                                        newNotes.splice(idx, 1);
                                                        handleUpdateTaskNote(selectedTask.id, newNotes);
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
                                                    style={{ minHeight: '100px', fontSize: '0.875rem', backgroundColor: 'var(--bg-primary)' }}
                                                    autoFocus
                                                />
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button 
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                                        onClick={() => {
                                                            const newNotes = [...selectedTask.notes];
                                                            newNotes[idx].text = editingText;
                                                            handleUpdateTaskNote(selectedTask.id, newNotes);
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
                            </div>

                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                                <textarea
                                    id="workspace-new-note"
                                    className="input"
                                    style={{ minHeight: '100px', fontSize: '0.9rem', marginBottom: '1rem', backgroundColor: 'var(--bg-secondary)' }}
                                    placeholder="Add a new entry to this task log..."
                                />
                                <button 
                                    className="btn btn-primary" 
                                    style={{ width: '100%' }}
                                    onClick={() => {
                                        const input = document.getElementById('workspace-new-note');
                                        if (input && input.value.trim()) {
                                            const newNotes = [...(selectedTask.notes || []), { text: input.value, timestamp: new Date().toISOString() }];
                                            handleUpdateTaskNote(selectedTask.id, newNotes);
                                            input.value = '';
                                        }
                                    }}
                                >
                                    + Add Log Entry
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Personal Note Interface (Normal Pad) */
                        <>
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
                                    padding: '1.25rem',
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
                        </>
                    )}
                    
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
