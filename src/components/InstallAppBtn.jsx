import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallAppBtn({ isCollapsed, variant = 'default' }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Optionally, check if successfully installed
        window.addEventListener('appinstalled', () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            console.log('PWA was installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    if (!isInstallable) return null;

    if (variant === 'icon') {
        return (
            <button
                onClick={handleInstallClick}
                title="Install App"
                style={{
                    background: 'transparent', border: 'none', color: 'var(--accent-primary)',
                    cursor: 'pointer', display: 'flex', padding: 0
                }}
            >
                <Download size={20} />
            </button>
        );
    }

    return (
        <button
            onClick={handleInstallClick}
            className="mobile-hidden-override install-app-btn"
            style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                border: 'none', background: 'var(--accent-primary)', textAlign: 'left',
                fontFamily: 'inherit',
                fontSize: '0.875rem', fontWeight: 600, color: '#ffffff',
                cursor: 'pointer', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                marginTop: '1rem',
                boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.3)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
        >
            <div style={{ flexShrink: 0, display: 'flex' }}>
                <Download size={18} />
            </div>
            {!isCollapsed && 'Install App'}
        </button>
    );
}
