import React, { useState, useEffect, useMemo } from 'react';
import { getTasks, updateTask, deleteTask, createTask, getStatuses, saveStatuses, getPriorities } from '../lib/data';
import { NavLink, useNavigate, Outlet, useMatch } from 'react-router-dom';
import { Columns, LayoutList, Plus, MoreHorizontal, FileText, Type, Users, Calendar, AlertCircle, Maximize2, ListChecks, Edit3, ArrowUpDown, Trash2 } from 'lucide-react';
import GlassDatePicker from '../components/GlassDatePicker';
import { formatTaskDate } from '../lib/utils';


export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('Table');
    const navigate = useNavigate();
    const match = useMatch('/tasks/:id');
    const isEditing = !!match;
    const [draggingCardId, setDraggingCardId] = useState(null);
    const [draggingColumnIndex, setDraggingColumnIndex] = useState(null);
    const [dragOverStatus, setDragOverStatus] = useState(null);
    const [activeBoardStatus, setActiveBoardStatus] = useState('');

    const [systemStatuses, setSystemStatuses] = useState([]);
    const [systemPriorities, setSystemPriorities] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isCompactView, setIsCompactView] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Allow Board on mobile now
    }, [isMobile, activeTab]);

    useEffect(() => {
        const handleDataSync = () => {
            setTasks(getTasks());
            const currentStatuses = getStatuses();
            setSystemStatuses(currentStatuses);
            setSystemPriorities(getPriorities());
            if (currentStatuses.length > 0 && !activeBoardStatus) {
                setActiveBoardStatus(currentStatuses[0].name);
            }
        };
        handleDataSync();
        window.addEventListener('appDataChanged', handleDataSync);
        window.addEventListener('storage', handleDataSync);
        return () => {
            window.removeEventListener('appDataChanged', handleDataSync);
            window.removeEventListener('storage', handleDataSync);
        };
    }, [activeBoardStatus]);

    const refreshTasks = () => setTasks(getTasks());
    
    const sortedTasks = useMemo(() => {
        const pOrder = {};
        systemPriorities.forEach((p, i) => {
            pOrder[p.name] = i;
        });

        return [...tasks].sort((a, b) => {
            // 1. Sort by Due Date (Ascending: Soonest first)
            const getTaskTime = (dueDate) => {
                if (!dueDate) return Infinity;
                const baseDateString = dueDate.split(' - ')[0];
                const d = new Date(baseDateString);
                return isNaN(d.getTime()) ? Infinity : d.getTime();
            };

            const timeA = getTaskTime(a.due_date);
            const timeB = getTaskTime(b.due_date);

            if (timeA !== timeB) return timeA - timeB;

            // 2. Sort by Priority (Descending: High first)
            const valA = pOrder[a.priority] || 0;
            const valB = pOrder[b.priority] || 0;
            if (valA !== valB) return valB - valA;

            // 3. Fallback: Created at (Newest first)
            const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return createdB - createdA;
        });
    }, [tasks, systemPriorities]);

    const handleUpdate = (id, field, value) => {
        updateTask(id, { [field]: value });
        refreshTasks();
    };

    const handleAddQuickTask = (status = 'Not started') => {
        createTask({
            title: 'New Task', assignee: '', due_date: '',
            priority: 'Low', status: status, content: ''
        });
        refreshTasks();
    };

    const onCardDragStart = (e, id) => {
        setDraggingCardId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        e.stopPropagation();
    };

    const handleColumnDragStart = (e, index) => {
        setDraggingColumnIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('layout/column', index);
    };

    const handleColumnDragOver = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

    const handleCardDragOver = (e, status) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggingCardId && dragOverStatus !== status) {
            setDragOverStatus(status);
        }
    };

    const handleCardDragLeave = (e, status) => {
        if (draggingCardId && dragOverStatus === status) {
            setDragOverStatus(null);
        }
    };

    const handleColumnDrop = (e, status, index) => {
        e.preventDefault();
        if (draggingColumnIndex !== null) {
            e.stopPropagation();
            if (draggingColumnIndex !== index) {
                const newStatuses = [...systemStatuses];
                const [draggedItem] = newStatuses.splice(draggingColumnIndex, 1);
                newStatuses.splice(index, 0, draggedItem);
                setSystemStatuses(newStatuses);
                saveStatuses(newStatuses);
            }
            setDraggingColumnIndex(null);
        } else if (draggingCardId) {
            handleUpdate(draggingCardId, 'status', status);
            setDraggingCardId(null);
            setDragOverStatus(null);
        }
    };

    const renderPill = (type, value) => {
        if (!value) return null;
        let className = 'badge ';
        let dotColor = null;

        if (type === 'status') {
            const match = systemStatuses.find(s => s.name === value);
            className += match ? match.color : 'badge-gray';
            dotColor = match ? `var(--${match.color}-text)` : 'var(--badge-gray-text)';
        }
        if (type === 'priority') {
            const match = systemPriorities ? systemPriorities.find(p => p.name === value) : null;
            className += match ? match.color : 'badge-gray';
        }

        return (
            <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {type === 'status' && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor, opacity: 0.8 }}></div>
                )}
                {value}
            </span>
        );
    };

    const renderGlassDropdown = (task, field, options) => {
        const isOpen = openDropdown === `${task.id}-${field}`;
        const currentValue = task[field] || '';

        return (
            <div style={{ position: 'relative', zIndex: isOpen ? 100 : 1 }}>
                <div onClick={(e) => { e.stopPropagation(); setOpenDropdown(isOpen ? null : `${task.id}-${field}`); }} style={{ cursor: 'pointer', display: 'inline-block' }}>
                    {renderPill(field, currentValue || (field === 'priority' ? 'Empty' : 'No Status'))}
                </div>
                {isOpen && (
                    <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); }}></div>
                        <div className="glass-dropdown">
                            {options.map(opt => (
                                <div
                                    key={opt.name}
                                    className={`glass-dropdown-item ${currentValue === opt.name ? 'selected' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); handleUpdate(task.id, field, opt.name); setOpenDropdown(null); }}
                                >
                                    {renderPill(field, opt.name || (field === 'priority' ? 'Empty' : 'No Status'))}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderTableView = () => (
        <div className="table-container">
            {isMobile ? (
                <div className="mobile-property-cards">
                    {sortedTasks.map(task => (
                        <div key={task.id} className="mobile-property-card">
                            <div className="prop-header" onClick={() => navigate(`/tasks/${task.id}`)}>
                                {task.title || 'Untitled'}
                            </div>
                            
                            <div className="prop-row">
                                <span className="prop-label">STATUS</span>
                                <div className="prop-value">{renderGlassDropdown(task, 'status', systemStatuses)}</div>
                            </div>
                            
                            <div className="prop-row">
                                <span className="prop-label">PRIORITY</span>
                                <div className="prop-value">{renderGlassDropdown(task, 'priority', systemPriorities)}</div>
                            </div>
                            
                            <div className="prop-row">
                                <span className="prop-label">DUE DATE</span>
                                <div className="prop-value">
                                    <GlassDatePicker value={task.due_date} onChange={val => handleUpdate(task.id, 'due_date', val)} placeholder="None" />
                                </div>
                            </div>
                            
                            <div className="prop-row">
                                <span className="prop-label">ASSIGNEE</span>
                                <div className="prop-value">
                                    <input type="text" className="prop-input"
                                        value={task.assignee} onChange={e => handleUpdate(task.id, 'assignee', e.target.value)} placeholder="Unassigned" />
                                </div>
                            </div>

                            <div className="prop-footer">
                                <button
                                    className="prop-delete-btn"
                                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this task?')) { deleteTask(task.id); refreshTasks(); } }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
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
                        {sortedTasks.map(task => (
                            <tr key={task.id}>
                                <td data-label="Task Name">
                                    <span style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }} onClick={() => navigate(`/tasks/${task.id}`)}>
                                        {task.title || 'Untitled'}
                                    </span>
                                </td>
                                <td data-label="Status">
                                    {renderGlassDropdown(task, 'status', systemStatuses)}
                                </td>
                                <td data-label="Priority">
                                    {renderGlassDropdown(task, 'priority', systemPriorities)}
                                </td>
                                <td data-label="Due Date">
                                    <GlassDatePicker value={task.due_date} onChange={val => handleUpdate(task.id, 'due_date', val)} placeholder="None" />
                                </td>
                                <td data-label="Assignee">
                                    <input type="text" style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                                        value={task.assignee} onChange={e => handleUpdate(task.id, 'assignee', e.target.value)} placeholder="Unassigned" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    const renderChecklistView = () => {
        const completedCount = tasks.filter(t => t.status === 'Done').length;
        const totalCount = tasks.length;
        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        return (
            <div className="checklist-container">
                <div className="checklist-summary">
                    <div className="summary-left">
                        <span className="summary-percentage">{Math.round(progress)}%</span>
                        <span className="summary-label">Tasks completed</span>
                    </div>
                    <div className="summary-progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="summary-right">
                        <span>{completedCount}/{totalCount}</span>
                    </div>
                </div>

                <div className="checklist-items">
                    {sortedTasks.map(task => (
                        <div key={task.id} className={`checklist-item ${task.status === 'Done' ? 'done' : ''}`} onClick={() => navigate(`/tasks/${task.id}`)}>
                            <div className="item-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={task.status === 'Done'}
                                    onChange={(e) => handleUpdate(task.id, 'status', e.target.checked ? 'Done' : 'Not started')}
                                    className="custom-checkbox"
                                />
                            </div>
                            <div className="item-content">
                                <span className="item-title">{task.title || 'Untitled'}</span>
                                <div className="item-meta">
                                    {renderPill('status', task.status || 'No Status')}
                                    {task.priority && renderPill('priority', task.priority)}
                                    {task.due_date && (
                                        <span className="item-date">
                                            <Calendar size={12} /> {formatTaskDate(task.due_date)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="item-assignee">
                                {task.assignee && (
                                    <div className="mini-avatar" title={task.assignee}>
                                        {task.assignee.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button className="checklist-add-btn" onClick={() => handleAddQuickTask()}>
                    <Plus size={18} /> Add New Task
                </button>
            </div>
        );
    };

    const renderMobileCards = () => (
        <div className={`mobile-task-cards ${isCompactView ? 'compact' : ''}`}>
            {sortedTasks.map(task => (
                <div key={task.id} className="mobile-task-card" onClick={() => navigate(`/tasks/${task.id}`)}>
                    <div className="card-top">
                        <div className="card-title-area">
                            <input
                                type="checkbox"
                                checked={task.status === 'Done'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleUpdate(task.id, 'status', e.target.checked ? 'Done' : 'Not started')}
                                className="card-checkbox"
                            />
                            <span className={`card-title ${task.status === 'Done' ? 'done' : ''}`}>
                                {task.title || 'Untitled'}
                            </span>
                        </div>
                        <div className="card-assignee-small">
                            {task.assignee && (
                                <div className="mini-avatar">{task.assignee.charAt(0).toUpperCase()}</div>
                            )}
                        </div>
                    </div>
                    <div className="card-meta">
                        <div className="meta-scroll">
                            {renderGlassDropdown(task, 'status', systemStatuses)}
                            {renderGlassDropdown(task, 'priority', systemPriorities)}
                            <div className="meta-date">
                                <GlassDatePicker value={task.due_date} onChange={val => handleUpdate(task.id, 'due_date', val)} placeholder="No Date" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <button className="mobile-add-btn" onClick={() => handleAddQuickTask()}>
                <Plus size={18} /> Add New Task
            </button>
        </div>
    );

    const renderBoardView = () => {
        const statuses = systemStatuses.map(s => s.name);
        return (
            <div className="board-view-wrapper">
                {isMobile && (
                    <div className="mobile-status-selector">
                        {systemStatuses.map(s => (
                            <div 
                                key={s.name} 
                                className={`mobile-status-pill-item ${activeBoardStatus === s.name ? 'active' : ''} ${dragOverStatus === s.name ? 'drop-target' : ''}`}
                                onClick={() => {
                                    setActiveBoardStatus(s.name);
                                    const el = document.getElementById(`col-${s.name}`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                onDragOver={(e) => {
                                    if (draggingCardId) {
                                        e.preventDefault();
                                        setDragOverStatus(s.name);
                                    }
                                }}
                                onDragLeave={() => {
                                    if (draggingCardId) setDragOverStatus(null);
                                }}
                                onDrop={(e) => {
                                    if (draggingCardId) {
                                        e.preventDefault();
                                        handleUpdate(draggingCardId, 'status', s.name);
                                        setDraggingCardId(null);
                                        setDragOverStatus(null);
                                        setActiveBoardStatus(s.name);
                                        refreshTasks();
                                    }
                                }}
                                style={{ 
                                    backgroundColor: activeBoardStatus === s.name ? `var(--${s.color}-text)` : 'rgba(255,255,255,0.1)',
                                    color: activeBoardStatus === s.name ? 'white' : 'var(--text-tertiary)',
                                    borderColor: activeBoardStatus === s.name ? 'white' : 'transparent'
                                }}
                            >
                                {s.name}
                            </div>
                        ))}
                    </div>
                )}
                <div className={`board ${isMobile ? 'mobile-vertical' : ''}`}>
                {statuses.map((status, index) => {
                    const columnTasks = sortedTasks.filter(t => status ? t.status === status : !t.status);
                    const displayStatus = status || 'No Status';
                    const isDraggingThisCol = draggingColumnIndex !== null && draggingColumnIndex === index;
                    const statusObj = systemStatuses.find(s => s.name === status);
                    const colColorClass = statusObj ? statusObj.color.replace('badge-', '') : 'gray';

                    return (
                        <div key={displayStatus}
                            id={`col-${displayStatus}`}
                            className={`board-column color-${colColorClass} ${dragOverStatus === status && draggingCardId ? 'drag-over' : ''}`}
                            draggable={true}
                            onDragStart={e => handleColumnDragStart(e, index)}
                            onDragOver={draggingCardId ? (e) => handleCardDragOver(e, status) : handleColumnDragOver}
                            onDragLeave={draggingCardId ? (e) => handleCardDragLeave(e, status) : undefined}
                            onDrop={e => handleColumnDrop(e, status, index)}
                            style={{
                                opacity: isDraggingThisCol ? 0.5 : 1,
                                cursor: isDraggingThisCol ? 'grabbing' : 'grab'
                            }}>
                            <div className="board-header">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {renderPill('status', displayStatus)}
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>{columnTasks.length}</span>
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)' }}>
                                    <MoreHorizontal size={14} style={{ cursor: 'pointer' }} />
                                    <Plus size={14} style={{ cursor: 'pointer' }} onClick={() => handleAddQuickTask(status)} />
                                </div>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                {columnTasks.map(task => (
                                    <div key={task.id}
                                        className={`task-card ${isMobile ? 'task-card-outline' : ''}`}
                                        draggable
                                        onDragStart={e => onCardDragStart(e, task.id)}
                                        onDragEnd={() => { setDraggingCardId(null); setDragOverStatus(null); }}
                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                        style={{ 
                                            opacity: draggingCardId === task.id ? 0.4 : 1, 
                                            transform: draggingCardId === task.id ? 'scale(0.98)' : 'scale(1)',
                                            backgroundColor: isMobile ? 'transparent' : 'var(--bg-secondary)',
                                            border: isMobile ? '1.5px solid var(--border-color)' : '1px solid var(--border-color)',
                                            borderRadius: isMobile ? 'var(--radius-lg)' : 'var(--radius-md)',
                                            cursor: 'grab'
                                        }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {task.title || 'Untitled'}
                                            {isMobile && task.priority && (
                                                <span className={`badge-outline ${systemPriorities.find(p => p.name === task.priority)?.color || 'badge-gray'}`} style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', border: '1px solid currentColor', borderRadius: '20px' }}>
                                                    {task.priority}
                                                </span>
                                            )}
                                        </div>
                                        {!isMobile && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                {renderPill('status', task.status || 'No Status')}
                                                {task.priority && renderPill('priority', task.priority)}
                                            </div>
                                        )}
                                        {task.due_date && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{formatTaskDate(task.due_date)}</div>}
                                        {(task.assignee || (task.notes && task.notes.length > 0)) && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                                {task.assignee ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>{task.assignee.charAt(0).toUpperCase()}</div>
                                                        {task.assignee}
                                                    </div>
                                                ) : <div></div>}
                                                {task.notes && task.notes.length > 0 && (
                                                    <div style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                                                        <FileText size={12} /> {task.notes.length}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button className={`board-add-btn color-${colColorClass}`} style={{ color: 'var(--text-tertiary)' }} onClick={() => handleAddQuickTask(status)}>
                                <Plus size={14} /> New page
                            </button>
                        </div>
                    );
                })}
                </div>
            </div>
        );
    };

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="page-header" style={{ marginBottom: '1rem' }}>
                <div>
                    <h1 className="page-title">Tasks Directory</h1>
                    <p className="page-subtitle">Manage and track your primary tasks.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {isMobile && (
                        <button 
                            className={`btn ${isCompactView ? 'btn-primary' : 'btn-secondary'}`} 
                            onClick={() => setIsCompactView(!isCompactView)}
                            style={{ padding: '0.5rem' }}
                            title={isCompactView ? "Expanded View" : "Compact View"}
                        >
                            {isCompactView ? <Maximize2 size={18} /> : <ListChecks size={18} />}
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => handleAddQuickTask()}>
                        <Plus size={18} /> New Task
                    </button>
                </div>
            </div>

            <div className="tabs">
                <div className={`tab ${activeTab === 'Table' ? 'active' : ''}`} onClick={() => setActiveTab('Table')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LayoutList size={16} /> Table
                </div>
                <div className={`tab ${activeTab === 'Board' ? 'active' : ''}`} onClick={() => setActiveTab('Board')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Columns size={16} /> Kanban Board
                </div>
                <div className={`tab ${activeTab === 'Checklist' ? 'active' : ''}`} onClick={() => setActiveTab('Checklist')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ListChecks size={16} /> Checklist
                </div>
            </div>

            <div className={`tasks-layout-container ${isEditing ? 'is-editing' : ''}`} style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                <div className="tasks-main-content" style={{ flex: isEditing ? '0 0 60%' : 1, overflow: 'auto', paddingRight: isEditing ? '1.5rem' : 0, transition: 'all 0.3s ease' }}>
                    {isMobile ? (
                        activeTab === 'Board' ? renderBoardView() : (activeTab === 'Checklist' ? renderChecklistView() : renderTableView())
                    ) : (
                        <>
                            {activeTab === 'Table' && renderTableView()}
                            {activeTab === 'Board' && renderBoardView()}
                            {activeTab === 'Checklist' && renderChecklistView()}
                        </>
                    )}
                </div>
                {isEditing && (
                    <div className="tasks-detail-sidebar" style={{ flex: '1', borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', overflowY: 'auto', paddingLeft: '1.5rem', marginLeft: '1.5rem' }}>
                        <Outlet />
                    </div>
                )}
            </div>
        </div>
    );
}
