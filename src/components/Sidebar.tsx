import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  CalendarDays,
  Presentation,
  CheckSquare,
  FileBarChart,
  Users,
  Building,
  MailCheck,
  ShieldAlert,
  Sparkles,
  UserCheck,
  LogOut,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { currentUser, logout } = useAuth();

  const isSuperUser = currentUser?.role === 'Super User' || currentUser?.role === 'Admin';
  const isAdmin = currentUser?.role === 'Admin';

  const navGroup = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Leave Management',
      items: [
        { id: 'submit-leave', label: 'Submit Leave', icon: CalendarPlus },
        { id: 'leave-history', label: 'Leave History', icon: History },
        { id: 'leave-calendar', label: 'Leave Calendar', icon: CalendarDays },
      ],
    },
    {
      title: 'Briefing & Attendance',
      items: [
        { id: 'briefings', label: 'Briefing Sessions', icon: Presentation },
        ...(isSuperUser
          ? [
              { id: 'take-attendance', label: 'Take Attendance', icon: CheckSquare },
              { id: 'attendance-summaries', label: 'Attendance Summaries', icon: FileBarChart },
              { id: 'followup-scheduler', label: 'Follow-up Scheduler', icon: Sparkles },
            ]
          : []),
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'Administration',
            items: [
              { id: 'admin-users', label: 'User Management', icon: Users },
              { id: 'admin-departments', label: 'Department Management', icon: Building },
              { id: 'admin-templates', label: 'Notification Templates', icon: MailCheck },
              { id: 'logs', label: 'Email & Audit Logs', icon: ShieldAlert },
            ],
          },
        ]
      : [
          {
            title: 'Logs & Activity',
            items: [{ id: 'logs', label: 'Email & Audit Logs', icon: ShieldAlert }],
          },
        ]),
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800">
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">LeavePlan & Hub</h1>
            <p className="text-[10px] text-slate-400 font-medium">Corporate Attendance & Leave</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-6 flex-1">
          {navGroup.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center px-3 py-2.5 text-xs font-medium rounded-lg transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card at Bottom */}
        {currentUser && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/50">
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-indigo-400 font-medium truncate">{currentUser.departmentName}</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-center transition-colors"
              >
                <Building2 className="w-3 h-3 mr-1 text-slate-400" /> Dept
              </button>
              <button
                onClick={logout}
                className="flex items-center justify-center py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded text-center transition-colors"
              >
                <LogOut className="w-3 h-3 mr-1" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
