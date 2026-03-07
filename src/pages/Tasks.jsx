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

    const [systemStatuses, setSystemStatuses] = useState([]);
    const [systemPriorities, setSystemPriorities] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);

    useEffect(() => {
        const handleDataSync = () => {
            setTasks(getTasks());
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
    }, []);

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
            <table className="table">
                <thead>
                    <tr>
                        <th>Task Name</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Due Date</th>
                        <th>Assignee</th>
                        <th className="desktop-hide">Actions</th>
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
                            <td className="mobile-only-action">
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this task?')) { deleteTask(task.id); refreshTasks(); } }}
                                    style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderChecklistView = () => (
        <div style={{ backgroundColor: 'transparent', height: '100%', overflow: 'visible' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 400, borderRight: '1px solid var(--border-color)', width: '35%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <Type size={16} /> Task <AlertCircle size={12} style={{ opacity: 0.5 }} />
                            </div>
                        </th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 400, borderRight: '1px solid var(--border-color)', width: '15%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px dotted var(--text-tertiary)' }}></div> Status <AlertCircle size={12} style={{ opacity: 0.5 }} />
                            </div>
                        </th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 400, borderRight: '1px solid var(--border-color)', width: '20%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <Users size={16} /> Assignee <AlertCircle size={12} style={{ opacity: 0.5 }} />
                            </div>
                        </th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 400, borderRight: '1px solid var(--border-color)', width: '15%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <Calendar size={16} /> Due <AlertCircle size={12} style={{ opacity: 0.5 }} />
                            </div>
                        </th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 400, borderRight: '1px solid var(--border-color)', width: '10%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <AlertCircle size={16} /> Priority <AlertCircle size={12} style={{ opacity: 0.5 }} />
                            </div>
                        </th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '5%' }}>
                            <Plus size={16} style={{ cursor: 'pointer', opacity: 0.5 }} />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTasks.map(task => (
                        <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.1s', ':hover': { backgroundColor: 'rgba(255,255,255,0.03)' } }}>
                            <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={task.status === 'Done'}
                                        onChange={(e) => handleUpdate(task.id, 'status', e.target.checked ? 'Done' : 'Not started')}
                                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--badge-green-text)' }}
                                    />
                                    <span style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', textDecoration: task.status === 'Done' ? 'line-through' : 'none', opacity: task.status === 'Done' ? 0.5 : 1 }} onClick={() => navigate(`/tasks/${task.id}`)}>
                                        {task.title || 'Untitled'}
                                    </span>
                                </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)', position: 'relative', overflow: 'visible' }}>
                                {renderGlassDropdown(task, 'status', systemStatuses)}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)' }}>
                                {task.assignee && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>{task.assignee.charAt(0).toUpperCase()}</div>
                                        {task.assignee.toUpperCase()}
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)' }}>
                                <GlassDatePicker value={task.due_date} onChange={val => handleUpdate(task.id, 'due_date', val)} placeholder="None" />
                            </td>
                            <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)', position: 'relative', overflow: 'visible' }}>
                                {renderGlassDropdown(task, 'priority', systemPriorities)}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            </td>
                        </tr>
                    ))}
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td colSpan="6" style={{ padding: '0.75rem 1rem' }}>
                            <button onClick={() => handleAddQuickTask()} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                <Plus size={16} /> New page
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    const renderBoardView = () => {
        const statuses = systemStatuses.map(s => s.name);
        return (
            <div className="board">
                {statuses.map((status, index) => {
                    const columnTasks = sortedTasks.filter(t => status ? t.status === status : !t.status);
                    const displayStatus = status || 'No Status';
                    const isDraggingThisCol = draggingColumnIndex !== null && draggingColumnIndex === index;
                    const statusObj = systemStatuses.find(s => s.name === status);
                    const colColorClass = statusObj ? statusObj.color.replace('badge-', '') : 'gray';

                    return (
                        <div key={displayStatus}
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
                                        className="task-card"
                                        draggable
                                        onDragStart={e => onCardDragStart(e, task.id)}
                                        onDragEnd={() => { setDraggingCardId(null); setDragOverStatus(null); }}
                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                        style={{ opacity: draggingCardId === task.id ? 0.4 : 1, transform: draggingCardId === task.id ? 'scale(0.98)' : 'scale(1)' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>{task.title || 'Untitled'}</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            {renderPill('status', task.status || 'No Status')}
                                            {task.priority && renderPill('priority', task.priority)}
                                        </div>
                                        {task.due_date && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{formatTaskDate(task.due_date)}</div>}
                                        {task.assignee && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>{task.assignee.charAt(0).toUpperCase()}</div>
                                                {task.assignee}
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
        );
    };

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="page-header" style={{ marginBottom: '1rem' }}>
                <div>
                    <h1 className="page-title">Tasks Directory</h1>
                    <p className="page-subtitle">Manage and track your primary tasks.</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleAddQuickTask()}>
                    <Plus size={18} /> New Task
                </button>
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
                    {activeTab === 'Table' && renderTableView()}
                    {activeTab === 'Board' && renderBoardView()}
                    {activeTab === 'Checklist' && renderChecklistView()}
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
