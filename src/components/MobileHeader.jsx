import React from 'react';
import BellNotification from './BellNotification';
import logo from '../assets/logo.png';

export default function MobileHeader() {
    return (
        <div className="mobile-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.25rem' }}>mytask</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <BellNotification isCollapsed={false} alignRight={true} />
            </div>
        </div>
    );
}
