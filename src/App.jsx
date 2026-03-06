import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import AIAssistant from './components/AIAssistant';
import ChromeToast from './components/ChromeToast';
import MobileNav from './components/MobileNav';

import { initDB, getWorkspaceConfig } from './lib/data';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import CreateTask from './pages/CreateTask';
import Calendar from './pages/Calendar';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Completed from './pages/Completed';

export default function App() {
  const [config, setConfig] = useState(getWorkspaceConfig());

  useEffect(() => {
    initDB();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const handleDataSync = () => {
      setConfig(getWorkspaceConfig());
    };
    window.addEventListener('appDataChanged', handleDataSync);
    return () => window.removeEventListener('appDataChanged', handleDataSync);
  }, []);

  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <MobileHeader />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />}>
              <Route path=":id" element={<TaskDetail />} />
            </Route>
            <Route path="/completed" element={<Completed />} />
            <Route path="/create-task" element={<CreateTask />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        {config.enable_ai_assistant && <AIAssistant />}
        <ChromeToast />
        <MobileNav />
      </div>
    </Router>
  );
}
