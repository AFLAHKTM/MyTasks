import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseAlarmsUrl = 'https://ikpumjioqkssnbrplgph.supabase.co';
const supabaseAlarmsAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcHVtamlvcWtzc25icnBsZ3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTcyNzIsImV4cCI6MjA4OTA3MzI3Mn0.PD-yDElsmaZ2l9RynXYUxO_Cw65-PT0f16jpNEXiJN0';
const supabaseAlarms = createClient(supabaseAlarmsUrl, supabaseAlarmsAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: window.localStorage // Explicitly use localStorage for persistence in Electron
  }
});

const AlarmContext = createContext();

const isElectron = typeof window !== 'undefined' && window.electronIPC !== undefined;

export const useAlarms = () => useContext(AlarmContext);

// Web push helper to decode vapid key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const PUBLIC_VAPID_KEY = 'BHIveZp2lY2puz_IghxNxwq0OEm_hMAIIEBnZI1abW_kGVSrOCKFsQ1ZsQKtZl5pV7WGSbu8FUPusUGZKgYuNbY';

export const AlarmProvider = ({ children }) => {
    const [alarms, setAlarms] = useState(() => {
        const saved = localStorage.getItem('app_alarms');
        return saved ? JSON.parse(saved) : [];
    });
    
    // The currently ringing alarm
    const [ringingAlarm, setRingingAlarm] = useState(null);
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

    useEffect(() => {
        audioRef.current.loop = true;
        
        // Initial fetch of alarms from Supabase
        const fetchAlarms = async () => {
            const { data: remoteAlarms } = await supabaseAlarms.from('alarms').select('*');
            if (remoteAlarms) {
               const localAlarms = JSON.parse(localStorage.getItem('app_alarms') || '[]');
               const alarmMap = new Map();
               localAlarms.forEach(a => alarmMap.set(a.id, a));

               let needsPush = false;
               remoteAlarms.forEach(remoteAlarm => {
                   const localAlarm = alarmMap.get(remoteAlarm.id);
                   if (!localAlarm || new Date(remoteAlarm.updated_at) > new Date(localAlarm.updated_at || 0)) {
                       alarmMap.set(remoteAlarm.id, remoteAlarm);
                   } else if (new Date(localAlarm.updated_at || 0) > new Date(remoteAlarm.updated_at)) {
                       needsPush = true;
                   }
               });

               const mergedAlarms = Array.from(alarmMap.values());
               setAlarms(mergedAlarms);
               localStorage.setItem('app_alarms', JSON.stringify(mergedAlarms));

               if (needsPush || (localAlarms.length > 0 && remoteAlarms.length === 0)) {
                   console.log('Pushing local alarms to cloud...');
                   await supabaseAlarms.from('alarms').upsert(mergedAlarms.map(a => ({
                       ...a,
                       updated_at: a.updated_at || new Date().toISOString()
                   })));
               }
            }
        };
        fetchAlarms();

        // Request notification permission and register for push notifications
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    registerPush();
                }
            });
        } else if (Notification.permission === 'granted') {
            registerPush();
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('app_alarms', JSON.stringify(alarms));
    }, [alarms]);

    const registerPush = async () => {
        if (isElectron) {
            console.log('Running in Electron, skipping Service Worker push registration.');
            return;
        }
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                let subscription = await registration.pushManager.getSubscription();
                
                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
                    });
                }
    
                // Save subscription to supabase
                const subData = JSON.parse(JSON.stringify(subscription));
                if (subData && subData.endpoint) {
                    const { error } = await supabaseAlarms.from('push_subscriptions').upsert({
                        endpoint: subData.endpoint,
                        keys_p256dh: subData.keys.p256dh,
                        keys_auth: subData.keys.auth
                    }, { onConflict: 'endpoint' });
                    
                    if (error) {
                        console.error('Push Subscription Upsert Error:', error);
                    }
                }
            } catch (error) {
                console.error('Service Worker or Push Manager error:', error);
            }
        }
    };

    useEffect(() => {
        localStorage.setItem('app_alarms', JSON.stringify(alarms));
    }, [alarms]);

    // Check alarms every second (for active frontend triggering)
    useEffect(() => {
        const timer = setInterval(() => {
            if (ringingAlarm) return; // Don't trigger another while one is ringing
            
            const now = new Date();
            const currentMs = now.getTime();

            const nextAlarmInfo = alarms.find(alarm => {
                if (alarm.status !== 'active' && alarm.status !== 'snoozed') return false;
                
                let triggerDateMs;
                if (alarm.trigger_utc) {
                    triggerDateMs = new Date(alarm.trigger_utc).getTime();
                } else {
                    const alarmDate = new Date(`${alarm.date}T${alarm.time}`);
                    triggerDateMs = alarmDate.getTime();
                    if (alarm.status === 'active' && alarm.reminderMinutes > 0) {
                       triggerDateMs -= (alarm.reminderMinutes * 60000);
                    }
                }

                if (alarm.status === 'snoozed' && alarm.snoozeUntil) {
                    triggerDateMs = new Date(alarm.snoozeUntil).getTime();
                }

                // If time to trigger is passed and within the last 60 minutes
                if (currentMs >= triggerDateMs && currentMs - triggerDateMs < 3600000) {
                    return true;
                }
                return false;
            });

            if (nextAlarmInfo) {
                triggerAlarm(nextAlarmInfo);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [alarms, ringingAlarm]);

    const triggerAlarm = async (alarm) => {
        setRingingAlarm(alarm);
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        
        await supabaseAlarms.from('alarms').update({ lastTriggeredAt: new Date().toISOString() }).eq('id', alarm.id);

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Task Alarm Triggered', {
                body: `It's time for: ${alarm.title}`,
                icon: '/vite.svg'
            });
        }
        
        // If wrapped in the Electron Desktop App, force window from tray to surface
        if (window.electronIPC) {
            window.electronIPC.showAlarmWindow();
        }
    };

    const addAlarm = async (alarm) => {
        console.log('Attempting to add alarm:', alarm);
        try {
            await registerPush(); // Ensure we have a push subscription
            
            const alarmDate = new Date(`${alarm.date}T${alarm.time}`);
            let triggerDate = alarmDate;
            if (alarm.reminderMinutes > 0) {
                triggerDate = new Date(alarmDate.getTime() - (alarm.reminderMinutes * 60000));
            }
            
            const newAlarm = { 
                ...alarm, 
                id: Date.now().toString(), 
                status: 'active',
                trigger_utc: triggerDate.toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('Created local alarm object:', newAlarm);
            setAlarms(prev => [...prev, newAlarm]);
            
            // Save to Supabase
            const { data, error } = await supabaseAlarms.from('alarms').insert([newAlarm]).select();
            if (error) {
                console.error('Supabase Error adding alarm:', error);
                // Even if supabase fails, it should be in local state, but we log for debugging
            } else {
                console.log('Supabase success:', data);
            }
        } catch (e) {
            console.error('General error in addAlarm:', e);
        }
    };

    const updateAlarm = async (id, updatedAlarm) => {
        // If they update date/time, recalculate trigger_utc
        let trigger_utc = null;
        if (updatedAlarm.date || updatedAlarm.time) {
            const currentAlarm = alarms.find(a => a.id === id) || {};
            const d = updatedAlarm.date || currentAlarm.date;
            const t = updatedAlarm.time || currentAlarm.time;
            const rm = updatedAlarm.reminderMinutes !== undefined ? updatedAlarm.reminderMinutes : currentAlarm.reminderMinutes;
            const newDate = new Date(`${d}T${t}`);
            trigger_utc = new Date(newDate.getTime() - ((rm || 0) * 60000)).toISOString();
        }
    
        const payload = trigger_utc ? { ...updatedAlarm, trigger_utc } : updatedAlarm;
        const now = new Date().toISOString();
        const fullPayload = { ...payload, updated_at: now };
        
        setAlarms(prev => prev.map(a => a.id === id ? { ...a, ...fullPayload } : a));
        await supabaseAlarms.from('alarms').update(fullPayload).eq('id', id);
    };

    const deleteAlarm = async (id) => {
        setAlarms(prev => prev.filter(a => a.id !== id));
        await supabaseAlarms.from('alarms').delete().eq('id', id);
    };

    const syncAlarmWithTask = async (task) => {
        const existing = alarms.find(a => a.task_id === task.id);

        // If task is Done, remove any existing alarm
        if (task.status === 'Done') {
            if (existing) {
                await deleteAlarm(existing.id);
            }
            return;
        }

        // Only sync if it has a due date
        if (!task.due_date) return;
        
        let dateObj;
        try {
            // Handle "start - end" ranges or single ISO strings
            const dateStr = task.due_date.includes(' - ') ? task.due_date.split(' - ')[0] : task.due_date;
            dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) return;
        } catch (e) {
            return;
        }

        const alarmData = {
            title: `Task: ${task.title || 'Untitled'}`,
            date: dateObj.toISOString().split('T')[0],
            time: dateObj.toTimeString().split(' ')[0].substring(0, 5), // "HH:mm"
            task_id: task.id,
            reminderMinutes: 0,
            status: 'active'
        };

        if (existing) {
            // Only update if something actually changed to avoid infinite loops or extra writes
            if (existing.title !== alarmData.title || 
                existing.date !== alarmData.date || 
                existing.time !== alarmData.time ||
                existing.status === 'completed') {
                await updateAlarm(existing.id, alarmData);
            }
        } else {
            await addAlarm(alarmData);
        }
    };

    const stopAlarm = () => {
        if (!ringingAlarm) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        updateAlarm(ringingAlarm.id, { status: 'completed' });
        setRingingAlarm(null);
    };

    const snoozeAlarm = () => {
        if (!ringingAlarm) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        const snoozeTime = new Date();
        snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
        
        updateAlarm(ringingAlarm.id, { 
            status: 'snoozed', 
            snoozeUntil: snoozeTime.toISOString() 
        });
        
        setRingingAlarm(null);
    };

    return (
        <AlarmContext.Provider value={{ alarms, addAlarm, updateAlarm, deleteAlarm, syncAlarmWithTask, stopAlarm, snoozeAlarm }}>
            {children}
            
            {ringingAlarm && (
                <div className="alarm-overlay">
                    <div className="alarm-popup">
                        <div className="alarm-icon-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell-ringing"><path d="M18 8c0-3.3-2.7-6-6-6s-6 2.7-6 6c0 4-2 6-2 6h16s-2-2-2-6" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /><path d="M22 8a2 2 0 0 1-3.46 0" /><path d="M2 8a2 2 0 0 0 3.46 0" /><path d="M21 21l-3-3" /><path d="M3 21l3-3" /></svg>
                        </div>
                        <h2>Alarm Triggered!</h2>
                        <p className="alarm-title">{ringingAlarm.title}</p>
                        <p className="alarm-time">Task Time: {ringingAlarm.time}</p>
                        
                        <div className="alarm-actions">
                            <button className="alarm-btn snooze-btn" onClick={snoozeAlarm}>Snooze (5m)</button>
                            <button className="alarm-btn stop-btn" onClick={stopAlarm}>Stop Alarm</button>
                        </div>
                    </div>
                </div>
            )}
        </AlarmContext.Provider>
    );
};
