import React, { useState, useEffect } from 'react';
import { X, MoreHorizontal } from 'lucide-react';
import logo from '../assets/logo.png';

export default function ChromeToast() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleToast = (e) => {
            const notif = e.detail;
            const newToastId = Date.now() + Math.random();
            setToasts(prev => [...prev, { ...notif, toastId: newToastId }]);

            // Chrome notifications auto-dismiss after ~7 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.toastId !== newToastId));
            }, 7000);
        };

        window.addEventListener('showChromeToast', handleToast);
        return () => window.removeEventListener('showChromeToast', handleToast);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.toastId !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="chrome-toast-container">
            {toasts.map(toast => (
                <div key={toast.toastId} className="chrome-toast">
                    <div className="chrome-toast-header">
                        <div className="chrome-toast-app-info">
                            <img src={logo} alt="Logo" className="chrome-toast-icon" />
                            <span className="chrome-toast-app-name">My Own Task</span>
                        </div>
                        <div className="chrome-toast-actions">
                            <button className="chrome-toast-btn"><MoreHorizontal size={14} /></button>
                            <button className="chrome-toast-btn" onClick={() => removeToast(toast.toastId)}><X size={14} /></button>
                        </div>
                    </div>

                    <div className="chrome-toast-body">
                        <div className="chrome-toast-title">{toast.title}</div>
                        <div className="chrome-toast-message">{toast.message}</div>
                        <div className="chrome-toast-domain">{toast.domain || 'mydailytasks.pages.dev'}</div>
                    </div>

                    <div className="chrome-toast-footer">
                        <button className="chrome-toast-action-btn" onClick={() => removeToast(toast.toastId)}>Close</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
