import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { Home, CheckSquare, Calendar, Plus, FileText, Bell, ListChecks, LayoutList, Columns, Edit3 } from 'lucide-react';

export default function MobileNav() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const isTasksPage = location.pathname === '/tasks';
    const activeTab = searchParams.get('tab') || 'Checklist';

    const mainNavItems = [
        { name: 'Home', path: '/', icon: <Home size={20} /> },
        { name: 'Checklist', path: '/tasks', icon: <CheckSquare size={18} /> },
        { name: 'Notes', path: '/notes', icon: <FileText size={20} /> },
        { name: 'Calendar', path: '/calendar', icon: <Calendar size={20} /> },
        { name: 'Alarms', path: '/alarms', icon: <Bell size={20} /> },
    ];

    const taskNavItems = [
        { name: 'Checklist', path: '/tasks', tab: 'Checklist', icon: <ListChecks size={20} /> },
        { name: 'Table', path: '/tasks', tab: 'Table', icon: <LayoutList size={20} /> },
        { name: 'Board', path: '/tasks', tab: 'Board', icon: <Columns size={20} /> },
        { name: 'Completed', path: '/tasks', tab: 'Completed', icon: <Edit3 size={20} /> },
        { name: 'Exit', path: '/', icon: <Home size={20} /> },
    ];

    const currentItems = isTasksPage ? taskNavItems : mainNavItems;

    return (
        <div className="mobile-nav-wrapper">
            {/* Floating Action Button */}
            <NavLink to="/create-task" className="mobile-fab">
                <Plus size={28} color="white" />
            </NavLink>

            {/* Bottom Taskbar */}
            <nav className="mobile-taskbar">
                {currentItems.map((item) => {
                    const isItemActive = item.tab 
                        ? (activeTab === item.tab && isTasksPage)
                        : (location.pathname === item.path && (!isTasksPage || item.name === 'Exit'));
                    
                    return (
                        <NavLink
                            key={item.name + (item.tab || '')}
                            to={item.tab ? `${item.path}?tab=${item.tab}` : item.path}
                            className={`mobile-nav-item ${isItemActive ? 'active' : ''}`}
                        >
                            <div className="mobile-nav-icon">{item.icon}</div>
                            <span className="mobile-nav-label">{item.name}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}
