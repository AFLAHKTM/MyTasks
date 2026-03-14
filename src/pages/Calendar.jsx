import React, { useState, useEffect } from 'react';
import { getTasks } from '../lib/data';
import { NavLink } from 'react-router-dom';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);

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
                        const dayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day));
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div key={day.toISOString()} style={{
                                padding: '0.5rem',
                                borderBottom: '1px solid var(--border-color)',
                                borderRight: '1px solid var(--border-color)',
                                backgroundColor: isToday ? 'var(--accent-light)' : 'var(--bg-primary)'
                            }}>
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
                                            backgroundColor: t.status === 'Done' ? 'var(--border-color)' : 'white',
                                            border: '1px solid var(--border-hover)',
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
        </div>
    );
}
