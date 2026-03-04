import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gdaranarqbgdsfdbkxbt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkYXJhbmFycWJnZHNmZGJreGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTMwODQsImV4cCI6MjA4NzE2OTA4NH0.lbx-gL4xhbpkakUkV05GGNLX9MH1-bWp9h_pmtIXDMc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DB_KEY = 'antigravity_tasks_db';
const DB_STATUSES_KEY = 'antigravity_statuses';
const DB_PRIORITIES_KEY = 'antigravity_priorities';
const DB_VERSION_KEY = 'antigravity_version';

let myInstanceId = uuidv4();

const getLocalVersion = () => {
  return parseInt(localStorage.getItem(DB_VERSION_KEY) || '0', 10);
};

const setLocalVersion = (v) => {
  localStorage.setItem(DB_VERSION_KEY, v.toString());
};

const DEFAULT_TASKS = [
  {
    id: uuidv4(),
    title: 'FM META AD CREATE',
    assignee: 'KTM AFLAH',
    due_date: new Date(new Date().getTime() + 86400000 * 2).toISOString(),
    priority: 'Low',
    status: 'In progress',
    content: '# FM Meta Ad Create\n\nNeed to research the competitor ads and craft 3 new ad creatives for the FM campaign.',
    created_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    title: 'Pencurve Batch Preparation',
    assignee: '',
    due_date: new Date().toISOString(),
    priority: 'High',
    status: 'Done',
    content: '',
    created_at: new Date(new Date().getTime() - 86400000 * 5).toISOString()
  },
  {
    id: uuidv4(),
    title: 'PLAN TOMORROW',
    assignee: '',
    due_date: '',
    priority: 'High',
    status: 'Not started',
    content: '',
    created_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    title: 'CALL TO UMMEE',
    assignee: '',
    due_date: new Date(new Date().getTime() + 86400000).toISOString(),
    priority: 'Low',
    status: '',
    content: '',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_STATUSES = [
  { name: '', color: 'badge-gray', isDefault: true },
  { name: 'Not started', color: 'badge-gray' },
  { name: 'In progress', color: 'badge-blue' },
  { name: 'Done', color: 'badge-green' }
];

const DEFAULT_PRIORITIES = [
  { name: '', color: 'badge-gray', isDefault: true },
  { name: 'Low', color: 'badge-green' },
  { name: 'High', color: 'badge-red' }
];

export const dispatchDataUpdate = () => {
  window.dispatchEvent(new Event('appDataChanged'));
};

const broadcastChannel = supabase.channel('mytask-sync', {
  config: {
    broadcast: { ack: false }
  }
});

broadcastChannel
  .on('broadcast', { event: 'full_sync' }, (payload) => {
    const incomingVersion = payload.payload.version;
    const localVersion = getLocalVersion();
    // Apply the sync payload unconditionally if it claims to be newer 
    if (incomingVersion > localVersion) {
      localStorage.setItem(DB_KEY, JSON.stringify(payload.payload.tasks));
      localStorage.setItem(DB_STATUSES_KEY, JSON.stringify(payload.payload.statuses));
      localStorage.setItem(DB_PRIORITIES_KEY, JSON.stringify(payload.payload.priorities));
      setLocalVersion(incomingVersion);
      dispatchDataUpdate();
    }
  })
  .on('broadcast', { event: 'request_sync' }, (payload) => {
    if (payload.payload.instanceId !== myInstanceId) {
      sendFullSync();
    }
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      broadcastChannel.send({
        type: 'broadcast',
        event: 'request_sync',
        payload: { instanceId: myInstanceId }
      }).catch(() => { });
    }
  });

const sendFullSync = () => {
  const tasks = getTasks();
  const statuses = getStatuses();
  const priorities = getPriorities();
  const version = getLocalVersion();

  broadcastChannel.send({
    type: 'broadcast',
    event: 'full_sync',
    payload: {
      tasks,
      statuses,
      priorities,
      version
    }
  }).catch(() => { });
};

const incrementVersionAndSync = () => {
  const newVersion = getLocalVersion() + 1;
  setLocalVersion(newVersion);
  dispatchDataUpdate();
  sendFullSync();
};

export const initDB = () => {
  const existingTasks = localStorage.getItem(DB_KEY);
  let initialized = false;

  if (!existingTasks) {
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_TASKS));
    initialized = true;
  }
  const existingStatuses = localStorage.getItem(DB_STATUSES_KEY);
  if (!existingStatuses) {
    localStorage.setItem(DB_STATUSES_KEY, JSON.stringify(DEFAULT_STATUSES));
    initialized = true;
  }
  const existingPriorities = localStorage.getItem(DB_PRIORITIES_KEY);
  if (!existingPriorities) {
    localStorage.setItem(DB_PRIORITIES_KEY, JSON.stringify(DEFAULT_PRIORITIES));
    initialized = true;
  }

  if (initialized) {
    incrementVersionAndSync();
  }
};

export const getStatuses = () => {
  const data = localStorage.getItem(DB_STATUSES_KEY);
  return data ? JSON.parse(data) : DEFAULT_STATUSES;
};

export const saveStatuses = (statuses) => {
  localStorage.setItem(DB_STATUSES_KEY, JSON.stringify(statuses));
  incrementVersionAndSync();
};

export const getPriorities = () => {
  const data = localStorage.getItem(DB_PRIORITIES_KEY);
  return data ? JSON.parse(data) : DEFAULT_PRIORITIES;
};

export const savePriorities = (priorities) => {
  localStorage.setItem(DB_PRIORITIES_KEY, JSON.stringify(priorities));
  incrementVersionAndSync();
};

export const getTasks = () => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : [];
};

export const getTask = (id) => {
  return getTasks().find(t => t.id === id) || null;
};

export const createTask = (taskData) => {
  const tasks = getTasks();
  const newTask = {
    ...taskData,
    id: uuidv4(),
    created_at: new Date().toISOString()
  };
  tasks.push(newTask);
  localStorage.setItem(DB_KEY, JSON.stringify(tasks));
  incrementVersionAndSync();
  return newTask;
};

export const updateTask = (id, updates) => {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    tasks[idx] = { ...tasks[idx], ...updates };
    localStorage.setItem(DB_KEY, JSON.stringify(tasks));
    incrementVersionAndSync();
    return tasks[idx];
  }
  return null;
};

export const deleteTask = (id) => {
  let tasks = getTasks();
  tasks = tasks.filter(t => t.id !== id);
  localStorage.setItem(DB_KEY, JSON.stringify(tasks));
  incrementVersionAndSync();
};
