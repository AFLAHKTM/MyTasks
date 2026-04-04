import React, { useState, useEffect } from 'react';
import { getTasks, updateTask } from '../lib/data';
import { NavLink } from 'react-router-dom';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [draggingTaskId, setDraggingTaskId] = useState(null);

    useEffect(() => {
        const handleDataSync = () => {
            setTasks(getTasks());
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

    const statusOrder = { 'Not started': 1, 'In progress': 2, 'Done': 3 };
    const getStatusRank = (s) => statusOrder[s || 'Not started'] || 1;

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
                        const dayTasks = tasks
                            .filter(t => t.due_date && isSameDay(new Date(t.due_date), day))
                            .sort((a, b) => getStatusRank(a.status) - getStatusRank(b.status));
                            
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div key={day.toISOString()} 
                                onClick={(e) => {
                                    if (e.target.closest('a')) return;
                                    if (dayTasks.length > 0) setSelectedDay({ date: day, tasks: dayTasks });
                                }}
                                style={{
                                    padding: '0.5rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    borderRight: '1px solid var(--border-color)',
                                    backgroundColor: isToday ? 'var(--accent-light)' : 'var(--bg-primary)',
                                    cursor: dayTasks.length > 0 ? 'pointer' : 'default',
                                    transition: 'background-color 0.2s',
                                }}
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
                                    {dayTasks.map(t => (
                                        <NavLink key={t.id} to={`/tasks/${t.id}`} style={{
                                            display: 'block', fontSize: '0.75rem', padding: '0.25rem 0.5rem',
                                            backgroundColor: t.status === 'Done' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                                            border: '1px solid var(--border-color)',
                                            color: t.status === 'Done' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                            textDecoration: t.status === 'Done' ? 'line-through' : 'none',
                                            borderRadius: 'var(--radius-md)',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}>
                                            • {t.title}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Day Breakdown Modal */}
            {selectedDay && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedDay(null)} />
                    <div className="card" style={{ position: 'relative', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', zIndex: 101, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            {format(selectedDay.date, 'MMMM do, yyyy')}
                            <button onClick={() => setSelectedDay(null)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '50%', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={16} />
                            </button>
                        </h2>

                        {['Not started', 'In progress', 'Done'].map(status => {
                            const statusTasks = selectedDay.tasks.filter(t => (t.status || 'Not started') === status || (status === 'Not started' && !t.status));

                            return (
                                <div 
                                    key={status} 
                                    style={{ marginBottom: '1.5rem', padding: '0.5rem', borderRadius: 'var(--radius-lg)', transition: 'background-color 0.2s', margin: '0 -0.5rem 1rem -0.5rem' }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; // highlight drop zone
                                    }}
                                    onDragLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        if (draggingTaskId) {
                                            updateTask(draggingTaskId, { status });
                                            // Refresh global tasks and local context seamlessly
                                            const newTasks = getTasks();
                                            setTasks(newTasks);
                                            setSelectedDay({
                                                date: selectedDay.date,
                                                tasks: newTasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), selectedDay.date))
                                            });
                                            setDraggingTaskId(null);
                                        }
                                    }}
                                >
                                    <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem', paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: status === 'Done' ? 'var(--success)' : status === 'In progress' ? 'var(--badge-blue-text)' : 'var(--text-tertiary)' }} />
                                        {status} ({statusTasks.length})
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '40px' }}>
                                        {statusTasks.length === 0 ? (
                                            <div style={{ margin: '0 0.5rem', padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem' }}>
                                                Drop tasks here to mark as {status}
                                            </div>
                                        ) : (
                                            statusTasks.map(t => (
                                                <NavLink 
                                                    key={t.id} 
                                                    to={`/tasks/${t.id}`}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        setDraggingTaskId(t.id);
                                                        e.dataTransfer.setData('text/plain', t.id);
                                                        // Fallback opacity for visual dragging effect
                                                        setTimeout(() => {
                                                            if (e.target) e.target.style.opacity = '0.4';
                                                        }, 0);
                                                    }}
                                                    onDragEnd={(e) => {
                                                        setDraggingTaskId(null);
                                                        if (e.target) e.target.style.opacity = '1';
                                                    }}
                                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textDecoration: t.status === 'Done' ? 'line-through' : 'none', color: t.status === 'Done' ? 'var(--text-tertiary)' : 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'grab', margin: '0 0.5rem' }}
                                                >
                                                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t.title}</span>
                                                    {t.priority && (
                                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                            {t.priority}
                                                        </span>
                                                    )}
                                                </NavLink>
                                            ))
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
