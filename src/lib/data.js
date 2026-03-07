import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zgxulqlhvctazxapqtvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpneHVscWxodmN0YXp4YXBxdHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODg2MTYsImV4cCI6MjA4ODE2NDYxNn0.tlCVE96oQLFa-enBtAKh125UCdwET5Kt8ImRBnBho2A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DB_KEY = 'antigravity_tasks_db';
const DB_STATUSES_KEY = 'antigravity_statuses';
const DB_PRIORITIES_KEY = 'antigravity_priorities';

const DB_CONFIG_KEY = 'antigravity_workspace_config';

const DEFAULT_CONFIG = {
  enable_ai_assistant: true,
  auto_archive_tasks: false,
  sync_system_clock: true
};

const DEFAULT_TASKS = [
  {
    id: '802deb6a-7f61-460b-8535-66d483488730',
    title: 'FM META AD CREATE',
    assignee: 'KTM AFLAH',
    due_date: new Date(new Date().getTime() + 86400000 * 2).toISOString(),
    priority: 'Low',
    status: 'In progress',
    content: '# FM Meta Ad Create\n\nNeed to research the competitor ads and craft 3 new ad creatives for the FM campaign.',
    created_at: new Date().toISOString()
  },
  {
    id: 'f4a66e44-d830-47b2-becd-8ed3cad4295e',
    title: 'Pencurve Batch Preparation',
    assignee: '',
    due_date: new Date().toISOString(),
    priority: 'High',
    status: 'Done',
    content: '',
    created_at: new Date(new Date().getTime() - 86400000 * 5).toISOString()
  },
  {
    id: 'a9d18e51-4680-496a-9359-2ff773b4d45c',
    title: 'PLAN TOMORROW',
    assignee: '',
    due_date: '',
    priority: 'High',
    status: 'Not started',
    content: '',
    created_at: new Date().toISOString()
  },
  {
    id: '9d864115-0811-49e0-82f5-2efc0803c734',
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
  { name: 'Medium', color: 'badge-yellow' },
  { name: 'High', color: 'badge-red' }
];

export const dispatchDataUpdate = () => {
  window.dispatchEvent(new Event('appDataChanged'));
};

// --- Sync Logic ---

const syncFromSupabase = async () => {
  try {
    const [tasksRes, statusesRes, prioritiesRes, configRes] = await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('statuses').select('*'),
      supabase.from('priorities').select('*'),
      supabase.from('workspace_config').select('*').eq('id', 'default').single()
    ]);

    // Handle incoming data without blindly overwriting local-only data
    if (tasksRes.data) {
      const remoteTasks = tasksRes.data;
      const localTasks = getTasks();
      
      // If we have local data but remote is empty, this might be a fresh project or a sync error.
      // Don't just clear local if local has tasks.
      if (remoteTasks.length === 0 && localTasks.length > 0) {
        console.log('Remote is empty, not overwriting non-empty local storage');
      } else {
        localStorage.setItem(DB_KEY, JSON.stringify(remoteTasks));
      }
    }
    
    if (statusesRes.data && statusesRes.data.length > 0) {
      localStorage.setItem(DB_STATUSES_KEY, JSON.stringify(statusesRes.data.map(s => ({ name: s.name, color: s.color, isDefault: s.is_default }))));
    }
    if (prioritiesRes.data && prioritiesRes.data.length > 0) {
      localStorage.setItem(DB_PRIORITIES_KEY, JSON.stringify(prioritiesRes.data.map(p => ({ name: p.name, color: p.color, isDefault: p.is_default }))));
    }
    if (configRes.data) {
      localStorage.setItem(DB_CONFIG_KEY, JSON.stringify({
        enable_ai_assistant: configRes.data.enable_ai_assistant,
        auto_archive_tasks: configRes.data.auto_archive_tasks,
        sync_system_clock: configRes.data.sync_system_clock
      }));
    }

    dispatchDataUpdate();
  } catch (error) {
    console.error('Error syncing from Supabase:', error);
  }
};

// Subscribe to real-time changes
const subscribeToChanges = () => {
  supabase
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => syncFromSupabase())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses' }, () => syncFromSupabase())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'priorities' }, () => syncFromSupabase())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_config' }, () => syncFromSupabase())
    .subscribe();
};

export const initDB = async () => {
  const existingTasks = localStorage.getItem(DB_KEY);
  const existingStatuses = localStorage.getItem(DB_STATUSES_KEY);
  const existingPriorities = localStorage.getItem(DB_PRIORITIES_KEY);
  const existingConfig = localStorage.getItem(DB_CONFIG_KEY);

  // 1. Initial Local Setup if empty
  if (!existingTasks) localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_TASKS));
  if (!existingStatuses) localStorage.setItem(DB_STATUSES_KEY, JSON.stringify(DEFAULT_STATUSES));
  if (!existingPriorities) localStorage.setItem(DB_PRIORITIES_KEY, JSON.stringify(DEFAULT_PRIORITIES));
  if (!existingConfig) localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));

  // 2. Start listening for changes IMMEDIATELY
  subscribeToChanges();

  // 3. Reconciliation: Push local data to Supabase to ensure cloud matches current device
  try {
    const tasks = getTasks();
    if (tasks.length > 0) {
      console.log('Synchronizing local content to cloud...');
      await supabase.from('tasks').upsert(tasks.map(t => ({
        id: t.id,
        title: t.title,
        assignee: t.assignee,
        due_date: t.due_date,
        priority: t.priority,
        status: t.status,
        content: t.content,
        created_at: t.created_at || new Date().toISOString()
      })));
    }

    const statuses = getStatuses();
    const priorities = getPriorities();
    
    // Always ensure basic infrastructure tables have defaults if they appear empty
    const { data: sRows } = await supabase.from('statuses').select('id').limit(1);
    if (!sRows || sRows.length === 0) {
      if (statuses.length > 0) await supabase.from('statuses').insert(statuses.map(s => ({ name: s.name, color: s.color, is_default: !!s.isDefault })));
    }
    
    const { data: pRows } = await supabase.from('priorities').select('id').limit(1);
    if (!pRows || pRows.length === 0) {
      if (priorities.length > 0) await supabase.from('priorities').insert(priorities.map(p => ({ name: p.name, color: p.color, is_default: !!p.isDefault })));
    }
  } catch (err) {
    console.warn('Silent reconciliation check failed (likely offline):', err);
  }

  // 4. Initial pull from cloud to catch updates from other devices
  await syncFromSupabase();

  // 5. Setup Wake-up sync listeners (crucial for mobile sleep/wake)
  const syncFunc = () => {
    console.log('Device woke up/focused. Refreshing data...');
    syncFromSupabase();
  };

  window.addEventListener('focus', syncFunc);
  window.addEventListener('online', syncFunc);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncFunc();
  });
};

export const getWorkspaceConfig = () => {
  const data = localStorage.getItem(DB_CONFIG_KEY);
  return data ? JSON.parse(data) : DEFAULT_CONFIG;
};

export const saveWorkspaceConfig = (config) => {
  localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(config));
  dispatchDataUpdate();

  // Update Supabase
  supabase.from('workspace_config').update(config).eq('id', 'default').then(({ error }) => {
    if (error) console.error('Supabase Config Update Error:', error);
  });
};

export const getStatuses = () => {
  const data = localStorage.getItem(DB_STATUSES_KEY);
  return data ? JSON.parse(data) : DEFAULT_STATUSES;
};

export const saveStatuses = (statuses) => {
  localStorage.setItem(DB_STATUSES_KEY, JSON.stringify(statuses));
  dispatchDataUpdate();

  // Update Supabase
  supabase.from('statuses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    .then(() => supabase.from('statuses').insert(statuses.map(s => ({ name: s.name, color: s.color, is_default: !!s.isDefault }))));
};

export const getPriorities = () => {
  const data = localStorage.getItem(DB_PRIORITIES_KEY);
  return data ? JSON.parse(data) : DEFAULT_PRIORITIES;
};

export const savePriorities = (priorities) => {
  localStorage.setItem(DB_PRIORITIES_KEY, JSON.stringify(priorities));
  dispatchDataUpdate();

  supabase.from('priorities').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    .then(() => supabase.from('priorities').insert(priorities.map(p => ({ name: p.name, color: p.color, is_default: !!p.isDefault }))));
};

export const getTasks = () => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : [];
};

export const getTask = (id) => {
  return getTasks().find(t => t.id === id) || null;
};

export const createTask = (taskData) => {
  const newTask = {
    ...taskData,
    id: uuidv4(),
    created_at: new Date().toISOString()
  };

  const tasks = getTasks();
  tasks.push(newTask);
  localStorage.setItem(DB_KEY, JSON.stringify(tasks));
  dispatchDataUpdate();

  // Save to Supabase (background)
  supabase.from('tasks').insert([newTask]).then(({ error }) => {
    if (error) console.error('Supabase Task Insert Error:', error);
  });

  return newTask;
};

export const updateTask = (id, updates) => {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    tasks[idx] = { ...tasks[idx], ...updates };
    localStorage.setItem(DB_KEY, JSON.stringify(tasks));
    dispatchDataUpdate();

    // Use upsert to ensure the task exists in Supabase even if migration failed
    supabase.from('tasks').upsert(tasks[idx]).then(({ error }) => {
      if (error) console.error('Supabase Task Update Error:', error);
    });

    return tasks[idx];
  }
  return null;
};

export const deleteTask = (id) => {
  let tasks = getTasks();
  tasks = tasks.filter(t => t.id !== id);
  localStorage.setItem(DB_KEY, JSON.stringify(tasks));
  dispatchDataUpdate();

  // Delete from Supabase (background)
  supabase.from('tasks').delete().eq('id', id).then(({ error }) => {
    if (error) console.error('Supabase Task Delete Error:', error);
  });
};
