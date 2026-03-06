import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO, isToday, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, HelpCircle, Clock } from 'lucide-react';

export default function GlassDatePicker({ value, onChange, placeholder = 'Select date' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [hasEndDate, setHasEndDate] = useState(false);
    const [includeTime, setIncludeTime] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [timeValue, setTimeValue] = useState('12:00');
    const containerRef = useRef(null);

    useEffect(() => {
        if (value) {
            // Try to parse range or single date
            if (value.includes(' - ')) {
                const parts = value.split(' - ');
                const s = parseISO(parts[0]);
                const e = parseISO(parts[1]);
                if (isValid(s)) {
                    setStartDate(s);
                    setCurrentMonth(s);
                }
                if (isValid(e)) {
                    setEndDate(e);
                    setHasEndDate(true);
                }
            } else {
                const d = parseISO(value);
                if (isValid(d)) {
                    setStartDate(d);
                    setCurrentMonth(d);
                    if (value.includes('T')) {
                        setIncludeTime(true);
                        setTimeValue(format(d, 'HH:mm'));
                    }
                }
            }
        }
    }, [value]);

    const toggleOpen = () => setIsOpen(!isOpen);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDateClick = (day) => {
        if (hasEndDate) {
            if (!startDate || (startDate && endDate)) {
                setStartDate(day);
                setEndDate(null);
            } else if (startDate && !endDate) {
                if (day < startDate) {
                    setEndDate(startDate);
                    setStartDate(day);
                } else {
                    setEndDate(day);
                }
            }
        } else {
            setStartDate(day);
            setEndDate(null);
            // Don't close immediately if includeTime is on
            if (!includeTime) {
                updateValue(day, null, includeTime, timeValue);
                setIsOpen(false);
            }
        }
    };

    const updateValue = (s, e, it, tv) => {
        if (!s) {
            onChange('');
            return;
        }

        let startStr = s.toISOString();
        if (it) {
            const [hours, minutes] = tv.split(':');
            const dateWithTime = new Date(s);
            dateWithTime.setHours(parseInt(hours), parseInt(minutes));
            startStr = dateWithTime.toISOString();
        }

        if (hasEndDate && e) {
            let endStr = e.toISOString();
            if (it) {
                const [hours, minutes] = tv.split(':');
                const endDateWithTime = new Date(e);
                endDateWithTime.setHours(parseInt(hours), parseInt(minutes));
                endStr = endDateWithTime.toISOString();
            }
            onChange(`${startStr} - ${endStr}`);
        } else {
            onChange(startStr);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="calendar-header">
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{format(currentMonth, 'MMM yyyy')}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={(e) => { e.stopPropagation(); setStartDate(new Date()); setEndDate(null); setCurrentMonth(new Date()); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: '0.75rem', cursor: 'pointer' }}>Today</button>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <ChevronLeft size={16} onClick={prevMonth} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                        <ChevronRight size={16} onClick={nextMonth} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                    </div>
                </div>
            </div>
        );
    };

    const renderDaysLabels = () => {
        const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return (
            <div className="calendar-grid">
                {days.map(day => (
                    <div key={day} className="calendar-day-label">{day}</div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const calStart = startOfWeek(monthStart);
        const calEnd = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = calStart;

        while (day <= calEnd) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const isSelected = (startDate && isSameDay(day, startDate)) || (endDate && isSameDay(day, endDate));
                const isInRange = startDate && endDate && day > startDate && day < endDate;
                const isCurrentMonth = isSameMonth(day, monthStart);

                days.push(
                    <div
                        key={day.toString()}
                        className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isInRange ? 'in-range' : ''} ${isToday(day) ? 'today' : ''}`}
                        onClick={() => handleDateClick(cloneDay)}
                        style={{
                            background: isInRange ? 'var(--accent-light)' : '',
                            borderRadius: isSelected ? '4px' : '0'
                        }}
                    >
                        {format(day, 'd')}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="calendar-grid" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="calendar-body">{rows}</div>;
    };

    const getDisplayValue = () => {
        if (!startDate) return '';
        let str = format(startDate, includeTime ? 'MMMM d, yyyy h:mm a' : 'MMMM d, yyyy');
        if (hasEndDate && endDate) {
            str += ' - ' + format(endDate, includeTime ? 'MMMM d, yyyy h:mm a' : 'MMMM d, yyyy');
        }
        return str;
    };

    const displayValue = getDisplayValue();

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <div
                onClick={toggleOpen}
                style={{
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    padding: '4px 0',
                    minWidth: '100px'
                }}
            >
                {displayValue || placeholder}
            </div>

            {isOpen && (
                <div className="date-picker-popup">
                    <input
                        type="text"
                        readOnly
                        value={displayValue}
                        placeholder="Select a date..."
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            marginBottom: '1rem',
                            outline: 'none'
                        }}
                    />

                    {renderHeader()}
                    {renderDaysLabels()}
                    {renderCells()}

                    <div className="date-picker-footer">
                        <div className="datepicker-toggle-item">
                            <span>End date</span>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={hasEndDate}
                                    onChange={(e) => {
                                        setHasEndDate(e.target.checked);
                                        if (!e.target.checked) setEndDate(null);
                                    }}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        <div className="datepicker-toggle-item">
                            <span>Include time</span>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={includeTime}
                                    onChange={(e) => setIncludeTime(e.target.checked)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        {includeTime && (
                            <div className="datepicker-toggle-item" style={{ marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={14} />
                                    <span>Time</span>
                                </div>
                                <input
                                    type="time"
                                    value={timeValue}
                                    onChange={(e) => setTimeValue(e.target.value)}
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.75rem',
                                        padding: '2px 4px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
                                onClick={() => { setStartDate(null); setEndDate(null); onChange(''); setIsOpen(false); }}
                            >
                                Clear
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
                                onClick={() => {
                                    updateValue(startDate, endDate, includeTime, timeValue);
                                    setIsOpen(false);
                                }}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

