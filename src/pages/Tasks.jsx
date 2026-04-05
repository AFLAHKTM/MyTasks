import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getTasks, updateTask, createTask, getTaskById, deleteTask } from '../lib/data';
import { useAlarms } from '../lib/AlarmContext';
import { 
    LayoutList, Columns, ListChecks, Edit3, Plus, 
    MoreHorizontal, Search, Filter, Calendar, 
    Clock, CheckCircle, ArrowRight, User, Trash2, 
    AlertCircle, Sparkles, Maximize2, FileText,
    ChevronRight, ChevronDown, Check, Zap, Sun, Moon
} from 'lucide-react';
import { format, isSameDay, isPast, isToday, parseISO, startOfDay, addDays } from 'date-fns';
import { formatTaskDate } from '../lib/utils';
import { useNavigate, Outlet, useParams } from 'react-router-dom';
import GlassDatePicker from '../components/GlassDatePicker';

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('Checklist');
    const [searchQuery, setSearchQuery] = useState('');
    const [showTodayOnly, setShowTodayOnly] = useState(true);
    const [isCompactView, setIsCompactView] = useState(false);
    const [draggingCardId, setDraggingCardId] = useState(null);
    const [dragOverStatus, setDragOverStatus] = useState(null);
    const [draggingColumnIndex, setDraggingColumnIndex] = useState(null);
    const [activeBoardStatus, setActiveBoardStatus] = useState('Not started');
    const { syncAlarmWithTask } = useAlarms();
    
    const navigate = useNavigate();
    const { taskId } = useParams();
    const isEditing = !!taskId;
    const isMobile = window.innerWidth <= 768;

    const refreshTasks = useCallback(() => {
        setTasks(getTasks());
    }, []);

    useEffect(() => {
        refreshTasks();
        const handleSync = () => refreshTasks();
        window.addEventListener('appDataChanged', handleSync);
        window.addEventListener('storage', handleSync);
        return () => {
            window.removeEventListener('appDataChanged', handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, [refreshTasks]);

    const systemStatuses = [
        { name: 'Not started', color: 'badge-gray' },
        { name: 'In progress', color: 'badge-blue' },
        { name: 'Done', color: 'badge-green' }
    ];

    const systemPriorities = [
        { name: 'Low', color: 'badge-blue' },
        { name: 'Medium', color: 'badge-orange' },
        { name: 'High', color: 'badge-red' }
    ];

    const handleUpdate = async (id, prop, value) => {
        const updated = updateTask(id, { [prop]: value });
        if (updated) {
            syncAlarmWithTask(updated);
            refreshTasks();
        }
    };

    const handleAddQuickTask = (status = 'Not started') => {
        const newTask = createTask({
            title: '',
            status,
            priority: 'Medium',
            due_date: showTodayOnly ? new Date().toISOString() : null
        });
        refreshTasks();
        navigate(`/tasks/${newTask.id}`);
    };

    const sortedTasks = useMemo(() => {
        let filtered = tasks;
        if (searchQuery) {
            filtered = filtered.filter(t => t.title?.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (showTodayOnly) {
            const today = new Date().getDay();
            filtered = filtered.filter(t => {
                if (t.recurring_days && (t.recurring_days.includes(today) || t.every_day)) return true;
                if (!t.due_date) return false;
                return isToday(new Date(t.due_date.split(' - ')[0])) || isPast(new Date(t.due_date.split(' - ')[0]));
            });
        }
        return filtered.sort((a, b) => {
            if (a.status === 'Done' && b.status !== 'Done') return 1;
            if (a.status !== 'Done' && b.status === 'Done') return -1;
            const dateA = a.due_date ? new Date(a.due_date) : new Date(0);
            const dateB = b.due_date ? new Date(b.due_date) : new Date(0);
            return dateA - dateB;
        });
    }, [tasks, searchQuery, showTodayOnly]);

    const onCardDragStart = (e, id) => {
        setDraggingCardId(id);
        e.dataTransfer.setData('taskId', id);
    };

    const handleCardDragOver = (e, status) => {
        e.preventDefault();
        setDragOverStatus(status);
    };

    const handleColumnDrop = (e, status) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('taskId') || draggingCardId;
        if (id) {
            handleUpdate(id, 'status', status);
        }
        setDraggingCardId(null);
        setDragOverStatus(null);
    };

    const renderPill = (type, value) => {
        const list = type === 'status' ? systemStatuses : systemPriorities;
        const matched = list.find(l => l.name === value) || { color: 'badge-gray' };
        return <span className={`badge ${matched.color}`}>{value}</span>;
    };

    const renderTableView = () => {
        if (isMobile) {
            return (
                <div className="flex-col gap-3">
                    {sortedTasks.map(task => (
                        <div key={task.id} className={`card ${task.status === 'Done' ? 'dimmed' : ''}`} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <input type="checkbox" checked={task.status === 'Done'} onChange={(e) => handleUpdate(task.id, 'status', e.target.checked ? 'Done' : 'Not started')} />
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title || 'Untitled Task'}</div>
                                </div>
                                <button className="btn-icon" onClick={() => navigate(`/tasks/${task.id}`)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)' }}>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {renderPill('status', task.status || 'Not started')}
                                {task.priority && renderPill('priority', task.priority)}
                            </div>
                            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Due:</span>
                                <GlassDatePicker value={task.due_date} onChange={val => handleUpdate(task.id, 'due_date', val)} />
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>Task Name</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th style={{ width: '180px' }}>Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTasks.map(task => (
                            <tr key={task.id} className={task.status === 'Done' ? 'dimmed' : ''}>
                                <td>
                                    <input type="checkbox" checked={task.status === 'Done'} onChange={(e) => { e.stopPropagation(); handleUpdate(task.id, 'status', e.target.checked ? 'Done' : 'Not started'); }} />
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{task.title || 'Untitled Task'}</div>
                                </td>
                                <td>{renderPill('status', task.status || 'Not started')}</td>
                                <td>{renderPill('priority', task.priority || 'Medium')}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <GlassDatePicker value={task.due_date} onChange={val => handleUpdate(task.id, 'due_date', val)} />
                                        <button 
                                            className="btn-icon" 
                                            onClick={() => navigate(`/tasks/${task.id}`)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderBoardView = () => {
        const statuses = systemStatuses.map(s => s.name);
        return (
            <div className="board-view-wrapper">
                {isMobile && (
                    <div className="mobile-status-selector" style={{ padding: '4px', background: 'var(--bg-secondary)', borderRadius: '35px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                        {systemStatuses.map(s => (
                            <div 
                                key={s.name} 
                                className={`mobile-status-pill-item ${activeBoardStatus === s.name ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveBoardStatus(s.name);
                                    const el = document.getElementById(`col-${s.name}`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                style={{ flex: 1, textAlign: 'center', padding: '0.6rem 0.5rem', borderRadius: '30px', fontSize: '0.7rem', fontWeight: 800, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', backgroundColor: activeBoardStatus === s.name ? `var(--${s.color}-text)` : 'transparent', color: activeBoardStatus === s.name ? 'white' : 'var(--text-tertiary)', boxShadow: activeBoardStatus === s.name ? `0 4px 15px var(--${s.color}-text)` : 'none' }}
                            >
                                {s.name}
                            </div>
                        ))}
                    </div>
                )}
                <div className={`board ${isMobile ? 'mobile-vertical' : ''}`}>
                    {statuses.map(status => {
                        const colTasks = sortedTasks.filter(t => (t.status || 'Not started') === status);
                        return (
                            <div 
                                key={status} 
                                id={`col-${status}`} 
                                className={`board-column ${dragOverStatus === status ? 'drag-over' : ''}`} 
                                onDragOver={(e) => handleCardDragOver(e, status)}
                                onDragLeave={() => setDragOverStatus(null)}
                                onDrop={(e) => handleColumnDrop(e, status)}
                                style={{ display: isMobile && activeBoardStatus !== status ? 'none' : 'flex' }}
                            >
                                <div className="board-header">
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {renderPill('status', status)}
                                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{colTasks.length}</span>
                                    </span>
                                    <Plus size={14} style={{ cursor: 'pointer' }} onClick={() => handleAddQuickTask(status)} />
                                </div>
                                <div className="board-cards">
                                    {colTasks.map(task => (
                                        <div 
                                            key={task.id} 
                                            className="task-card" 
                                            draggable 
                                            onDragStart={(e) => onCardDragStart(e, task.id)}
                                            style={{ cursor: 'grab' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>{task.title || 'Untitled'}</div>
                                                <button 
                                                    className="btn-icon" 
                                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', padding: 0 }}
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem' }}>
                                                {task.priority && renderPill('priority', task.priority)}
                                                {task.due_date && <span style={{ color: 'var(--text-tertiary)' }}>{formatTaskDate(task.due_date)}</span>}
                                            </div>
                                        </div>
                                    ))}
                                    <button className="board-add-btn" onClick={() => handleAddQuickTask(status)}><Plus size={14} /> New Task</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderFocusView = () => {
        const getHour = (dateStr) => {
            if (!dateStr) return 99;
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? 99 : d.getHours();
        };
        const morning = sortedTasks.filter(t => t.status !== 'Done' && getHour(t.due_date) < 12);
        const midday = sortedTasks.filter(t => t.status !== 'Done' && getHour(t.due_date) >= 12 && getHour(t.due_date) < 16);
        const evening = sortedTasks.filter(t => t.status !== 'Done' && getHour(t.due_date) >= 16 && getHour(t.due_date) < 24);
        const unscheduled = sortedTasks.filter(t => t.status !== 'Done' && getHour(t.due_date) === 99);

        const Section = ({ title, tasks, color }) => (
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{tasks.length} items</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tasks.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>Clear for now!</p>
                    ) : (
                        tasks.map(task => (
                            <div 
                                key={task.id} 
                                className="card" 
                                style={{ 
                                    padding: '1.25rem', 
                                    borderLeft: `6px solid ${color}`,
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '16px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    <div 
                                        style={{ 
                                            width: '24px', height: '24px', borderRadius: '50%', 
                                            border: `2px solid ${task.status === 'Done' ? color : 'var(--border-color)'}`, 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                        onClick={(e) => { e.stopPropagation(); handleUpdate(task.id, 'status', task.status === 'Done' ? 'Not started' : 'Done'); }}
                                    >
                                        {task.status === 'Done' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }}></div>}
                                    </div>
                                    <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks/${task.id}`)}>
                                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{task.title || 'Untitled Task'}</h3>
                                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            <span>⏰ {task.due_date ? format(new Date(task.due_date), 'hh:mm a') : 'Anytime'}</span>
                                            {task.priority && <span style={{ color: `var(--${systemPriorities.find(p => p.name === task.priority)?.color || 'gray'}-text)` }}>• {task.priority}</span>}
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-icon" onClick={() => navigate(`/tasks/${task.id}`)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)' }}>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
        return (
            <div className="focus-view" style={{ maxWidth: '600px', margin: '0 auto', width: '100%', padding: '1rem' }}>
                <Section title="Morning" tasks={morning} color="#fbbf24" />
                <Section title="Midday" tasks={midday} color="#4ade80" />
                <Section title="Evening" tasks={evening} color="#f87171" />
                {unscheduled.length > 0 && <Section title="Later / Anytime" tasks={unscheduled} color="var(--accent-primary)" /> }
            </div>
        );
    };

    const renderView = () => {
        switch (activeTab) {
            case 'Checklist': return renderFocusView();
            case 'Table': return renderTableView();
            case 'Board': return renderBoardView();
            case 'Completed': return <div className="completed-view">{renderTableView()}</div>;
            default: return renderFocusView();
        }
    };

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="page-header" style={{ marginBottom: '0.5rem' }}>
                <div><h1 className="page-title">Tasks Directory</h1></div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {!isMobile && (
                        <button className={`btn ${isCompactView ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsCompactView(!isCompactView)}>
                            {isCompactView ? <Maximize2 size={18} /> : <ListChecks size={18} />}
                        </button>
                    )}
                    {!isMobile && <button className="btn btn-primary" onClick={() => handleAddQuickTask()}><Plus size={18} /> New Task</button>}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={16} /><span style={{ fontWeight: 600, fontSize: '0.875rem' }}>TODAY IS {format(new Date(), 'EEEE').toUpperCase()}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button onClick={() => { if (confirm('Reschedule overdue tasks?')) { sortedTasks.forEach(t => isPast(new Date(t.due_date)) && handleUpdate(t.id, 'due_date', new Date().toISOString())); } }} style={{ background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--text-tertiary)', fontSize: '0.7rem', padding: '0.4rem 0.75rem', borderRadius: '18px' }}>RESCHEDULE ALL</button>
                    <div className="filter-toggle" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '3px' }}>
                        <button onClick={() => setShowTodayOnly(true)} style={{ padding: '0.4rem 1.25rem', fontSize: '0.75rem', borderRadius: '18px', border: 'none', background: showTodayOnly ? 'var(--accent-primary)' : 'transparent', color: showTodayOnly ? 'white' : 'var(--text-tertiary)' }}>TODAY</button>
                        <button onClick={() => setShowTodayOnly(false)} style={{ padding: '0.4rem 1.25rem', fontSize: '0.75rem', borderRadius: '18px', border: 'none', background: !showTodayOnly ? 'var(--accent-primary)' : 'transparent', color: !showTodayOnly ? 'white' : 'var(--text-tertiary)' }}>ALL</button>
                    </div>
                </div>
            </div>

            <div className="tabs" style={{ margin: '1rem 0', padding: '4px', background: 'var(--bg-secondary)', borderRadius: '30px', border: '1px solid var(--border-color)', display: 'inline-flex', alignSelf: 'center', width: isMobile ? 'auto' : 'fit-content' }}>
                {['Checklist', 'Table', 'Board', 'Completed'].map(tab => (
                    <div key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} style={{ padding: isMobile ? '0.6rem 1.25rem' : '0.6rem 1.5rem', borderRadius: '25px', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.3s ease' }}>
                        {tab === 'Checklist' && <ListChecks size={isMobile ? 20 : 16} />}
                        {tab === 'Table' && <LayoutList size={isMobile ? 20 : 16} />}
                        {tab === 'Board' && <Columns size={isMobile ? 20 : 16} />}
                        {tab === 'Completed' && <Edit3 size={isMobile ? 20 : 16} />}
                        {!isMobile && tab}
                    </div>
                ))}
            </div>

            <div className={`tasks-layout-container ${isEditing ? 'is-editing' : ''}`} style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                <div className="tasks-main-content" style={{ flex: isEditing ? '0 0 60%' : 1, overflow: 'auto', transition: 'all 0.3s ease' }}>
                    {renderView()}
                </div>
                {isEditing && <div className="tasks-detail-sidebar" style={{ flex: '1', borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', overflowY: 'auto', padding: '1.5rem' }}><Outlet /></div>}
            </div>
        </div>
    );
}
