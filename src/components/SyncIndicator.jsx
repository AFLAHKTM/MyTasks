import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/data';

export default function SyncIndicator() {
    const [status, setStatus] = useState('online'); // online, offline, syncing

    useEffect(() => {
        const handleDataChange = () => {
            setStatus('syncing');
            setTimeout(() => setStatus('online'), 1000);
        };

        window.addEventListener('appDataChanged', handleDataChange);

        // Simple connectivity check
        const interval = setInterval(async () => {
            try {
                const { error } = await supabase.from('workspace_config').select('id').limit(1);
                if (error) setStatus('offline');
                else if (status === 'offline') setStatus('online');
            } catch (e) {
                setStatus('offline');
            }
        }, 10000);

        return () => {
            window.removeEventListener('appDataChanged', handleDataChange);
            clearInterval(interval);
        };
    }, [status]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-secondary)',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: status === 'online' ? 'var(--success)' : (status === 'syncing' ? 'var(--accent-primary)' : 'var(--danger)'),
            border: '1px solid var(--border-color)',
            transition: 'all 0.3s ease'
        }}>
            {status === 'online' && <Cloud size={14} />}
            {status === 'offline' && <CloudOff size={14} />}
            {status === 'syncing' && <RefreshCw size={14} className="spin" />}

            <span style={{ textTransform: 'uppercase' }}>
                {status === 'online' ? 'System Live' : (status === 'syncing' ? 'Syncing...' : 'Offline')}
            </span>

            <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: status === 'online' ? 'var(--success)' : (status === 'syncing' ? 'var(--accent-primary)' : 'var(--danger)'),
                boxShadow: status === 'online' ? '0 0 8px var(--success)' : 'none'
            }}></div>
        </div>
    );
}
