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
import { useNavigate, useParams, Outlet, useSearchParams } from 'react-router-dom';
import GlassDatePicker from '../components/GlassDatePicker';

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const navigate = useNavigate();
    const { id: taskId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('view') || 'Checklist');
    const isEditing = !!taskId;
    const isMobile = window.innerWidth <= 768;

    useEffect(() => {
        const view = searchParams.get('view');
        if (view) {
            setActiveTab(view);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!searchParams.get('view')) {
            setSearchParams({ view: activeTab }, { replace: true });
        }
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ view: tab });
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [showTodayOnly, setShowTodayOnly] = useState(true);
    const [isCompactView, setIsCompactView] = useState(false);
    const [draggingCardId, setDraggingCardId] = useState(null);
    const [dragOverStatus, setDragOverStatus] = useState(null);
    const [draggingColumnIndex, setDraggingColumnIndex] = useState(null);
    const [activeBoardStatus, setActiveBoardStatus] = useState('Not started');
    const { syncAlarmWithTask } = useAlarms();
    
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
            const todayDay = new Date().getDay();
            filtered = filtered.filter(t => {
                const hasRecurring = t.recurring_days && t.recurring_days.length > 0;
                // If task has a recurring schedule, ONLY show on scheduled days
                if (hasRecurring) {
                    return t.every_day || t.recurring_days.includes(todayDay);
                }
                // Non-recurring: show if due today or no due date
                if (!t.due_date) return true;
                return isToday(new Date(t.due_date.split(' - ')[0]));
            });
        }
        // Board/Table: hide checklist-only tasks (those added via Checklist quick-add)
        if (activeTab === 'Table' || activeTab === 'Board') {
            filtered = filtered.filter(t => !t.checklist_only);
        }
        // Board view: show all tasks including Done (in their column)
        // Checklist & Table: hide Done tasks (use Completed tab for those)
        // Completed tab: show only Done tasks
        if (activeTab === 'Completed') {
            filtered = filtered.filter(t => t.status === 'Done');
        } else if (activeTab !== 'Board' && activeTab !== 'Checklist') {
            filtered = filtered.filter(t => t.status !== 'Done');
        }
        return filtered.sort((a, b) => {
            if (activeTab === 'Completed') {
                const dateA = a.due_date ? new Date(a.due_date) : new Date(0);
                const dateB = b.due_date ? new Date(b.due_date) : new Date(0);
                return dateB - dateA; // newest first for completed
            }
            if (a.status === 'Done' && b.status !== 'Done') return 1;
            if (a.status !== 'Done' && b.status === 'Done') return -1;
            const dateA = a.due_date ? new Date(a.due_date) : new Date(0);
            const dateB = b.due_date ? new Date(b.due_date) : new Date(0);
            return dateA - dateB;
        });
    }, [tasks, searchQuery, showTodayOnly, activeTab]);

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

    const renderPill = (type, value, taskId) => {
        const list = type === 'status' ? systemStatuses : systemPriorities;
        const matched = list.find(l => l.name === value) || { color: 'badge-gray' };
        
        const handleClick = (e) => {
            e.stopPropagation();
            if (!taskId) return;
            const currentIndex = list.findIndex(l => l.name === value);
            const nextIndex = (currentIndex + 1) % list.length;
            handleUpdate(taskId, type, list[nextIndex].name);
        };

        return <span className={`badge ${matched.color}`} style={{ cursor: 'pointer', userSelect: 'none' }} onClick={handleClick}>{value}</span>;
    };

    const renderTableView = () => {
        if (isMobile) {
            return (
                <div className="flex-col gap-3">
                    {sortedTasks.map(task => (
                        <div 
                            key={task.id} 
                            className={`card ${task.status === 'Done' ? 'dimmed' : ''}`} 
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title || 'Untitled Task'}</div>
                                </div>
                                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${task.id}`); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)' }}>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                {task.status && renderPill('status', task.status, task.id)}
                                {task.priority && renderPill('priority', task.priority, task.id)}
                            </div>
                            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={(e) => e.stopPropagation()}>
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
                            <tr 
                                key={task.id} 
                                className={task.status === 'Done' ? 'dimmed' : ''}
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td>
                                    <input type="checkbox" checked={task.status === 'Done'} onChange={(e) => { e.stopPropagation(); handleUpdate(task.id, 'status', e.target.checked ? 'Done' : 'Not started'); }} />
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{task.title || 'Untitled Task'}</div>
                                </td>
                                <td>{renderPill('status', task.status || 'Not started', task.id)}</td>
                                <td>{renderPill('priority', task.priority || 'Medium', task.id)}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <GlassDatePicker value={task.due_date} onChange={val => handleUpdate(task.id, 'due_date', val)} />
                                        <ChevronRight size={18} opacity={0.5} />
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
                    <div className="mobile-status-selector" style={{ padding: '4px', background: 'var(--bg-secondary)', borderRadius: '35px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex' }}>
                        {systemStatuses.map(s => (
                            <div 
                                key={s.name} 
                                className={`mobile-status-pill-item ${activeBoardStatus === s.name ? 'active' : ''} ${dragOverStatus === s.name ? 'drag-over' : ''}`}
                                onClick={() => {
                                    setActiveBoardStatus(s.name);
                                    const el = document.getElementById(`col-${s.name}`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                onDragOver={(e) => handleCardDragOver(e, s.name)}
                                onDragLeave={() => setDragOverStatus(null)}
                                onDrop={(e) => handleColumnDrop(e, s.name)}
                                style={{ 
                                    flex: 1, 
                                    textAlign: 'center', 
                                    padding: '0.6rem 0.5rem', 
                                    borderRadius: '30px', 
                                    fontSize: '0.7rem', 
                                    fontWeight: 800, 
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                                    backgroundColor: activeBoardStatus === s.name ? `var(--${s.color}-text)` : (dragOverStatus === s.name ? 'rgba(255,255,255,0.1)' : 'transparent'), 
                                    color: activeBoardStatus === s.name ? 'white' : 'var(--text-tertiary)', 
                                    boxShadow: activeBoardStatus === s.name ? `0 4px 15px var(--${s.color}-text)` : 'none',
                                    border: dragOverStatus === s.name ? '1px dashed var(--accent-primary)' : '1px solid transparent'
                                }}
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
                                        {renderPill('status', status, null)}
                                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{colTasks.length}</span>
                                    </span>
                                    <button 
                                        className="btn-icon" 
                                        onClick={(e) => { e.stopPropagation(); handleAddQuickTask(status); }} 
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px' }}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="board-cards">
                                    {colTasks.map(task => (
                                        <div 
                                            key={task.id} 
                                            className="task-card" 
                                            draggable 
                                            onDragStart={(e) => onCardDragStart(e, task.id)}
                                            onClick={() => navigate(`/tasks/${task.id}`)}
                                            style={{ cursor: draggingCardId === task.id ? 'grabbing' : 'pointer' }}
                                        >
                                            <div 
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                                                onClick={(e) => { navigate(`/tasks/${task.id}`); }}
                                            >
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>{task.title || 'Untitled'}</div>
                                                <ChevronRight size={16} opacity={0.5} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem' }}>
                                                {task.priority && renderPill('priority', task.priority, task.id)}
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
        const morning = sortedTasks.filter(t => getHour(t.due_date) < 12);
        const midday = sortedTasks.filter(t => getHour(t.due_date) >= 12 && getHour(t.due_date) < 16);
        const evening = sortedTasks.filter(t => getHour(t.due_date) >= 16 && getHour(t.due_date) < 24);
        const unscheduled = sortedTasks.filter(t => getHour(t.due_date) === 99);

        const QuickAddRow = ({ sectionHour }) => {
            const [val, setVal] = React.useState('');
            const submit = () => {
                if (!val.trim()) return;
                const due = new Date();
                if (sectionHour !== null) due.setHours(sectionHour, 0, 0, 0);
                createTask({
                    title: val.trim(),
                    status: 'Not started',
                    priority: 'Medium',
                    due_date: sectionHour !== null ? due.toISOString() : null,
                    checklist_only: true
                });
                refreshTasks();
                setVal('');
            };
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <input
                        type="text"
                        value={val}
                        onChange={e => setVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submit()}
                        placeholder="Add a task..."
                        style={{
                            flex: 1, padding: '0.6rem 0.9rem', borderRadius: '12px',
                            border: '1px dashed var(--border-color)',
                            background: 'rgba(255,255,255,0.03)',
                            color: 'var(--text-primary)', fontSize: '0.875rem',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={submit}
                        style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: 'var(--accent-primary)', border: 'none',
                            color: 'white', fontSize: '1.2rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                        }}
                    >
                        <Plus size={18} />
                    </button>
                </div>
            );
        };

        const Section = ({ title, tasks, color, sectionHour }) => (
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
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                style={{ 
                                    padding: '1.25rem', 
                                    borderLeft: `6px solid ${color}`,
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '16px',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    <div 
                                        style={{ 
                                            width: '24px', height: '24px', borderRadius: '50%', 
                                            border: `2px solid ${task.status === 'Done' ? color : 'var(--border-color)'}`, 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        onClick={(e) => { e.stopPropagation(); handleUpdate(task.id, 'status', task.status === 'Done' ? 'Not started' : 'Done'); }}
                                    >
                                        {task.status === 'Done' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }}></div>}
                                    </div>
                                    <div style={{ opacity: task.status === 'Done' ? 0.6 : 1 }}>
                                        <h3 style={{ 
                                            fontSize: '1.05rem', 
                                            fontWeight: 600, 
                                            color: 'var(--text-primary)', 
                                            marginBottom: '0.2rem',
                                            textDecoration: task.status === 'Done' ? 'line-through' : 'none'
                                        }}>{task.title || 'Untitled Task'}</h3>
                                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            <span>⏰ {task.due_date ? format(new Date(task.due_date), 'hh:mm a') : 'Anytime'}</span>
                                            {task.priority && renderPill('priority', task.priority, task.id)}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={18} opacity={0.5} />
                            </div>
                        ))
                    )}
                </div>
                <QuickAddRow sectionHour={sectionHour} />
            </div>
        );
        return (
            <div className="focus-view" style={{ maxWidth: '600px', margin: '0 auto', width: '100%', padding: '1rem' }}>
                <Section title="Morning" tasks={morning} color="#fbbf24" sectionHour={9} />
                <Section title="Midday" tasks={midday} color="#4ade80" sectionHour={12} />
                <Section title="Evening" tasks={evening} color="#f87171" sectionHour={18} />
                <Section title="Later / Anytime" tasks={unscheduled} color="var(--accent-primary)" sectionHour={null} />
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
            <div className="page-header" style={{ marginBottom: '0.5rem', display: (isMobile && isEditing) ? 'none' : 'flex' }}>
                <div><h1 className="page-title">Tasks Directory</h1></div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {!isMobile && (
                        <button className={`btn ${isCompactView ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsCompactView(!isCompactView)}>
                            {isCompactView ? <Maximize2 size={18} /> : <ListChecks size={18} />}
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => handleAddQuickTask()}><Plus size={18} /> New Task</button>
                </div>
            </div>

            <div style={{ display: (isMobile && isEditing) ? 'none' : 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
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

            {!isMobile && (
                <div className="tabs" style={{ margin: '1rem 0', padding: '4px', background: 'var(--bg-secondary)', borderRadius: '30px', border: '1px solid var(--border-color)', display: isEditing ? 'none' : 'inline-flex', alignSelf: 'center', width: 'fit-content' }}>
                    {['Checklist', 'Table', 'Board', 'Completed'].map(tab => (
                        <div key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => handleTabChange(tab)} style={{ padding: '0.6rem 1.5rem', borderRadius: '25px', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.3s ease' }}>
                            {tab === 'Checklist' && <ListChecks size={16} />}
                            {tab === 'Table' && <LayoutList size={16} />}
                            {tab === 'Board' && <Columns size={16} />}
                            {tab === 'Completed' && <Edit3 size={16} />}
                            {tab}
                        </div>
                    ))}
                </div>
            )}

            <div className={`tasks-layout-container ${isEditing ? 'is-editing' : ''}`} style={{ flex: 1, overflow: 'hidden', display: 'flex', height: '100%', position: 'relative' }}>
                <div 
                    className="tasks-main-content" 
                    style={{ 
                        flex: isEditing ? (isMobile ? '0' : '0 0 60%') : 1, 
                        overflow: 'auto', 
                        transition: 'all 0.3s ease',
                        display: (isMobile && isEditing) ? 'none' : 'block'
                    }}
                >
                    {renderView()}
                </div>
                {isEditing && (
                    <div 
                        className="tasks-detail-sidebar" 
                        style={{ 
                            flex: '1', 
                            borderLeft: isMobile ? 'none' : '1px solid var(--border-color)', 
                            backgroundColor: 'var(--bg-primary)', 
                            overflowY: 'auto', 
                            padding: isMobile ? '1rem' : '1.5rem',
                            position: isMobile ? 'absolute' : 'relative',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 100,
                            height: '100%'
                        }}
                    >
                        <Outlet />
                    </div>
                )}
            </div>
        </div>
    );
}
