import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, HeartPulse, Stethoscope, UserCheck, 
  CalendarCheck, FolderHeart, FileSpreadsheet, Users2, Pill, 
  CalendarRange, Video, Bell, Activity, LineChart, ShieldAlert, 
  Key, Settings, LogOut, RefreshCw, CheckCircle, AlertTriangle,
  Terminal
} from 'lucide-react';

interface SidebarItem {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<any>;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', path: '/users', label: 'User Management', icon: Users },
  { id: 'patients', path: '/patients', label: 'Patient Management', icon: HeartPulse },
  { id: 'doctors', path: '/doctors', label: 'Doctor Management', icon: Stethoscope },
  { id: 'approvals', path: '/approvals', label: 'Doctor Approvals', icon: UserCheck },
  { id: 'appointments', path: '/appointments', label: 'Appointment Management', icon: CalendarCheck },
  { id: 'records', path: '/records', label: 'Medical Records (EHR)', icon: FolderHeart },
  { id: 'prescriptions', path: '/prescriptions', label: 'Prescription Management', icon: FileSpreadsheet },
  { id: 'family', path: '/family', label: 'Family Management', icon: Users2 },
  { id: 'medications', path: '/medications', label: 'Medication Management', icon: Pill },
  { id: 'followups', path: '/followups', label: 'Follow-Up Management', icon: CalendarRange },
  { id: 'video', path: '/video', label: 'Video Consultations', icon: Video },
  { id: 'notifications', path: '/notifications', label: 'Notifications', icon: Bell },
  { id: 'metrics', path: '/metrics', label: 'Health Metrics', icon: Activity },
  { id: 'analytics', path: '/analytics', label: 'Analytics & Reports', icon: LineChart },
  { id: 'audit', path: '/audit', label: 'Audit Logs', icon: ShieldAlert },
  { id: 'ops', path: '/ops', label: 'Ops Console', icon: Terminal },
  { id: 'permissions', path: '/permissions', label: 'Roles & Permissions', icon: Key },
  { id: 'settings', path: '/settings', label: 'System Settings', icon: Settings },
];

interface AdminLayoutProps {
  apiStatus: { text: string; state: 'healthy' | 'loading' | 'offline' };
  onLogout: () => void;
  adminName: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  apiStatus,
  onLogout,
  adminName
}) => {
  const location = useLocation();
  const currentItem = SIDEBAR_ITEMS.find(i => location.pathname.startsWith(i.path)) || SIDEBAR_ITEMS[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19]">
      
      {/* SIDEBAR */}
      <aside className="w-[260px] flex flex-col bg-[#111827] border-r border-[#1f2937]">
        
        {/* Sidebar Header Logo */}
        <div className="h-[70px] shrink-0 flex items-center px-6 border-b border-[#1f2937]">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
            Lumina Control
          </span>
        </div>
        
        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 scrollbar-none">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-[#1e293b] text-[#f8fafc] border-l-4 border-teal-500 shadow-md' 
                    : 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-[#f8fafc]'
                }`}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-teal-400' : 'text-[#64748b]'} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        
        {/* Sidebar Footer Widget */}
        <div className="p-4 shrink-0 border-t border-[#1f2937] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1e293b] flex items-center justify-center text-teal-400 font-semibold border border-[#334155]">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#f8fafc] truncate max-w-[110px]" title={adminName}>
                {adminName}
              </span>
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider">
                System Admin
              </span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 rounded-lg text-[#94a3b8] hover:bg-red-500/10 hover:text-red-500 transition-all duration-150"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      
      {/* MAIN FRAME */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header bar */}
        <header className="h-[70px] shrink-0 bg-[#111827] border-b border-[#1f2937] flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold text-[#f8fafc]">
            {currentItem?.label}
          </h1>
          
          <div className="flex items-center gap-3 text-xs bg-[#0b0f19] px-4 py-2 rounded-full border border-[#1f2937]">
            {apiStatus.state === 'healthy' && <CheckCircle size={14} className="text-emerald-500" />}
            {apiStatus.state === 'loading' && <RefreshCw size={14} className="text-amber-500 animate-spin" />}
            {apiStatus.state === 'offline' && <AlertTriangle size={14} className="text-rose-500" />}
            <span className="text-[#94a3b8]">
              API: <strong className="text-[#f8fafc]">{apiStatus.text}</strong>
            </span>
          </div>
        </header>
        
        {/* Dynamic View container using Outlet */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#0b0f19]">
          <Outlet />
        </div>
        
      </main>
    </div>
  );
};
