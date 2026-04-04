import React, { useState, useEffect } from 'react';
import { getTasks, getStatuses, updateTask, getPriorities } from '../lib/data';
import { NavLink } from 'react-router-dom';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [isDraggingId, setIsDraggingId] = useState(null);
    const [dragOverStatus, setDragOverStatus] = useState(null);

    useEffect(() => {
        const handleDataSync = () => {
                const allTasks = getTasks();
                // Migration: Support for new recurring_days array
                let migrated = false;
                const newTasks = allTasks.map(t => {
                    // Start from scratch if no recurring_days
                    if (!t.recurring_days) {
                        migrated = true;
                        let days = [];
                        if (t.recurring_rule === 'MWF') days = [1, 3, 5];
                        else if (t.recurring_rule === 'TUE_SUN') days = [2, 0];
                        else if (t.every_day === true) days = [0, 1, 2, 3, 4, 5, 6];
                        return { ...t, recurring_days: days };
                    }
                    return t;
                });
                
                if (migrated) {
                    newTasks.forEach(t => updateTask(t.id, t));
                    setTasks(newTasks);
                } else {
                    setTasks(allTasks);
                }
                
                setStatuses(getStatuses());
                setPriorities(getPriorities());
        };
        handleDataSync();
        window.addEventListener('appDataChanged', handleDataSync);
        window.addEventListener('storage', handleDataSync);
        return () => {
            window.removeEventListener('appDataChanged', handleDataSync);
            window.removeEventListener('storage', handleDataSync);
        };
    }, []);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const today = () => setCurrentDate(new Date());

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1400px' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{format(currentDate, 'MMMM yyyy')}</h1>
                    <p className="page-subtitle">Timeline View</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="btn btn-secondary" onClick={today}>Today</button>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={prevMonth}><ChevronLeft size={18} /></button>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={nextMonth}><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} style={{ padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{day}</div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: 'minmax(120px, 1fr)', flex: 1, overflowY: 'auto' }}>
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                        <div key={`pad-${i}`} style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }} />
                    ))}

                    {daysInMonth.map(day => {
                        const dayOfWeek = day.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
                        const dayTasks = tasks.filter(t => {
                            // Date match
                            if (t.due_date && isSameDay(new Date(t.due_date), day)) return true;
                            // Multi-day match
                            if (t.recurring_days && t.recurring_days.includes(dayOfWeek)) return true;
                            return false;
                        });
                        
                        // Sort dayTasks based on User's requested order: Not started -> In progress -> Done
                        const sortedDayTasks = [...dayTasks].sort((a, b) => {
                            const order = { 'Not started': 1, 'In progress': 2, 'Done': 3 };
                            return (order[a.status] || 99) - (order[b.status] || 99);
                        });

                        const isToday = isSameDay(day, new Date());
                        const isSelected = selectedDay && isSameDay(day, selectedDay);

                        return (
                            <div key={day.toISOString()} 
                                onClick={() => setSelectedDay(day)}
                                style={{
                                    padding: '0.5rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    borderRight: '1px solid var(--border-color)',
                                    backgroundColor: isSelected ? 'rgba(67, 108, 240, 0.1)' : (isToday ? 'var(--accent-light)' : 'var(--bg-primary)'),
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                className="calendar-day-cell"
                            >
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                                    <span style={{
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        fontSize: '0.875rem', fontWeight: isToday ? 600 : 400,
                                        backgroundColor: isToday ? 'var(--accent-primary)' : 'transparent',
                                        color: isToday ? 'white' : 'var(--text-primary)'
                                    }}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {sortedDayTasks.map(t => {
                                        const statusObj = statuses.find(s => s.name === t.status);
                                        const colorClass = statusObj ? statusObj.color : 'badge-gray';
                                        
                                        return (
                                            <NavLink key={t.id} to={`/tasks/${t.id}`} className={`calendar-event ${colorClass} ${t.status === 'Done' ? 'done' : ''}`} style={{
                                                display: 'block', 
                                                fontSize: '0.7rem', 
                                                padding: '0.15rem 0.4rem',
                                                textDecoration: 'none',
                                                borderRadius: '4px',
                                                whiteSpace: 'nowrap', 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis',
                                                marginBottom: '2px',
                                                border: '1px solid transparent'
                                            }}>
                                                <span className="event-dot" style={{ 
                                                    display: 'inline-block', 
                                                    width: '6px', 
                                                    height: '6px', 
                                                    borderRadius: '50%', 
                                                    marginRight: '6px',
                                                    backgroundColor: 'currentColor' 
                                                }}></span>
                                                {t.title}
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected Day Summary Panel */}
            {selectedDay && (
                <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)', animation: 'popup-spring 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                Tasks for {format(selectedDay, 'MMMM do, yyyy')}
                            </h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0 0' }}>Grouped by status</p>
                        </div>
                        <button className="btn btn-secondary" onClick={() => setSelectedDay(null)}>Hide Detail</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {['Not started', 'In progress', 'Done'].map(statusGroup => {
                            const dayOfWeek = selectedDay.getDay();
                            const groupTasks = tasks.filter(t => {
                                let matchesDay = false;
                                if (t.due_date && isSameDay(new Date(t.due_date), selectedDay)) matchesDay = true;
                                if (t.recurring_days && t.recurring_days.includes(dayOfWeek)) matchesDay = true;
                                return matchesDay && t.status === statusGroup;
                            });
                            const isOver = dragOverStatus === statusGroup;
                            
                            return (
                                <div 
                                    key={statusGroup}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverStatus(statusGroup); }}
                                    onDragLeave={() => setDragOverStatus(null)}
                                    onDrop={() => {
                                        if (isDraggingId) {
                                            updateTask(isDraggingId, { status: statusGroup });
                                            setTasks(getTasks());
                                            setIsDraggingId(null);
                                            setDragOverStatus(null);
                                        }
                                    }}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-lg)',
                                        backgroundColor: isOver ? 'var(--bg-tertiary)' : 'transparent',
                                        border: isOver ? '2px dashed var(--accent-primary)' : '2px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusGroup === 'Done' ? '#10b981' : (statusGroup === 'In progress' ? '#3b82f6' : '#94a3b8') }}></div>
                                        {statusGroup}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {groupTasks.map(task => {
                                            const priorityObj = priorities.find(p => p.name === task.priority);
                                            const pColorClass = priorityObj ? priorityObj.color : 'badge-gray';
                                            
                                            return (
                                                <NavLink 
                                                    key={task.id} 
                                                    to={`/tasks/${task.id}`} 
                                                    draggable
                                                    onDragStart={() => setIsDraggingId(task.id)}
                                                    onDragEnd={() => setIsDraggingId(null)}
                                                    className="hover-card task-card-outline" 
                                                    style={{ 
                                                        padding: '1rem', 
                                                        borderRadius: 'var(--radius-lg)', 
                                                        border: '1.5px solid var(--border-color)', 
                                                        backgroundColor: 'transparent', 
                                                        textDecoration: 'none', 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center',
                                                        cursor: 'grab',
                                                        opacity: isDraggingId === task.id ? 0.4 : 1
                                                    }}
                                                >
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{task.title}</span>
                                                    {task.priority && (
                                                        <span className={`badge-outline ${pColorClass}`} style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', border: '1px solid currentColor', borderRadius: '20px', fontWeight: 600 }}>
                                                            {task.priority}
                                                        </span>
                                                    )}
                                                </NavLink>
                                            );
                                        })}
                                        {groupTasks.length === 0 && !isOver && (
                                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                                No {statusGroup.toLowerCase()} tasks
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
