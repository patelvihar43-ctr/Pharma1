import React from 'react';
import { 
  LayoutDashboard, 
  FilePlus, 
  ClipboardCheck, 
  ShieldCheck, 
  Settings, 
  LogOut,
  User as UserIcon,
  Activity
} from 'lucide-react';
import { User } from '../types';
import { motion } from 'motion/react';
import Notifications from './Notifications';

interface LayoutProps {
  user: User;
  token: string;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ user, token, onLogout, children, activeTab, setActiveTab }: LayoutProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE', 'HOD', 'QA', 'IT_ADMIN', 'SUPER_ADMIN'] },
    { id: 'new-request', label: 'New Request', icon: FilePlus, roles: ['EMPLOYEE'] },
    { id: 'approvals', label: 'Pending Approvals', icon: ClipboardCheck, roles: ['HOD', 'QA', 'IT_ADMIN'] },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck, roles: ['EMPLOYEE', 'HOD', 'QA', 'IT_ADMIN', 'SUPER_ADMIN'] },
    { id: 'admin', label: 'Admin Control', icon: Settings, roles: ['IT_ADMIN', 'SUPER_ADMIN'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex font-sans text-[#1A1A1A]">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-black flex flex-col shadow-xl border-r border-black/5">
        <div className="p-6 border-b border-black/5">
          <div className="flex items-center gap-3 mb-2 text-emerald-600">
            <Activity size={28} />
            <h1 className="text-xl font-bold tracking-tight uppercase">PharmaFlow</h1>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-black/40 font-mono">IT Request Management</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                  : 'text-black/60 hover:bg-black/5 hover:text-black'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-black/5">
          <div className="bg-black/5 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <UserIcon size={16} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{user.full_name}</p>
                <p className="text-[10px] text-black/40 uppercase tracking-tighter">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-black/40 font-mono">Current View /</span>
            <span className="text-sm font-bold uppercase tracking-tight">
              {menuItems.find(i => i.id === activeTab)?.label}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Notifications token={token} />
            <div className="w-px h-8 bg-black/5" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-black/40 uppercase font-bold">Department</span>
              <span className="text-xs font-bold">{user.department}</span>
            </div>
            <div className="w-px h-8 bg-black/5" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-black/40 uppercase font-bold">Employee ID</span>
              <span className="text-xs font-mono font-bold">{user.employee_id}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
