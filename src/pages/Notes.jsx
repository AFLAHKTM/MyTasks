import React, { useState, useEffect } from 'react';
import { getNotes, saveNotes } from '../lib/data';
import { StickyNote, Save, Trash2, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Notes() {
    const [content, setContent] = useState(getNotes());
    const [lastSaved, setLastSaved] = useState(null);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        const handleDataSync = () => {
            if (!isTyping) {
                setContent(getNotes());
            }
        };
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

            <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem', fontWeight: 500, backgroundColor: 'var(--bg-secondary)' }}>
                    <FileText size={14} /> workspace_notes.md
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
                        caretColor: 'var(--accent-primary)'
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
            
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                <p>Personal notes are stored locally in your browser.</p>
                <p>{content.length} characters | {content.split(/\s+/).filter(Boolean).length} words</p>
            </div>
        </div>
    );
}
