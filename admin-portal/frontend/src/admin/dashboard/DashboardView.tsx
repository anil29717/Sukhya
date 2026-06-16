import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getStorageStats } from '../services/adminApi';
import { 
  Users, UserCheck, Calendar, Folder, HardDrive, 
  ArrowUpRight 
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

interface Stats {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  total_reports: number;
  pending_doctors: number;
  pending_appointments: number;
}

interface ActivityLog {
  id: number;
  action: string;
  resource: string | null;
  details: string | null;
  created_at: string;
}

interface UsageReport {
  new_patients: number;
  new_doctors: number;
  appointments_booked: number;
  appointments_completed: number;
  records_uploaded: number;
  prescriptions_created: number;
  notifications_sent: number;
}

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [storageMb, setStorageMb] = useState<number | null>(null);
  const [storageFiles, setStorageFiles] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        // Load Analytics
        const resStats = await api.get('/admin/analytics');
        setStats(resStats.data);

        // Load Activities
        const resLogs = await api.get('/admin/audit-logs?page_size=5');
        setActivities(resLogs.data.items || []);

        // Load Usage Reports (30 Days)
        const resUsage = await api.get('/admin/usage-reports?days=30');
        setUsage(resUsage.data);

        const resStorage = await getStorageStats();
        setStorageMb(resStorage.data.total_mb);
        setStorageFiles(resStorage.data.total_files);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-500"></div>
      </div>
    );
  }

  // Deduce combined metrics
  const totalUsers = (stats?.total_patients || 0) + (stats?.total_doctors || 0);
  const storageLabel = storageMb != null ? `${storageMb.toFixed(1)} MB` : '—';

  const chartData = [
    { label: 'New Patients', value: usage?.new_patients || 0 },
    { label: 'New Doctors', value: usage?.new_doctors || 0 },
    { label: 'Booked', value: usage?.appointments_booked || 0 },
    { label: 'Completed', value: usage?.appointments_completed || 0 },
    { label: 'Uploaded', value: usage?.records_uploaded || 0 },
    { label: 'Scripts', value: usage?.prescriptions_created || 0 },
    { label: 'Alerts', value: usage?.notifications_sent || 0 }
  ];

  return (
    <div className="space-y-8">
      
      {/* Metrics Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Users" 
          value={totalUsers} 
          icon={Users} 
          color="blue"
          trend="up"
          trendValue="12%"
        />
        <StatCard 
          label="Total Patients" 
          value={stats?.total_patients || 0} 
          icon={Users} 
          color="teal"
          trend="up"
          trendValue="8%"
        />
        <StatCard 
          label="Total Doctors" 
          value={stats?.total_doctors || 0} 
          icon={Users} 
          color="purple"
        />
        <StatCard 
          label="Doctor Approvals" 
          value={stats?.pending_doctors || 0} 
          icon={UserCheck} 
          color="amber"
          trend={stats?.pending_doctors ? 'neutral' : 'down'}
          trendValue={stats?.pending_doctors ? 'Needs Action' : 'All Clear'}
        />
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Active Bookings" 
          value={stats?.pending_appointments || 0} 
          icon={Calendar} 
          color="sky"
        />
        <StatCard 
          label="Completed Bookings" 
          value={(stats?.total_appointments || 0) - (stats?.pending_appointments || 0)} 
          icon={Calendar} 
          color="emerald"
        />
        <StatCard 
          label="EHR Documents" 
          value={stats?.total_reports || 0} 
          icon={Folder} 
          color="teal"
          trend="up"
          trendValue="43 Files"
        />
        <StatCard 
          label="Storage Usage" 
          value={storageLabel} 
          icon={HardDrive} 
          color="indigo"
          trend="neutral"
          trendValue={storageFiles != null ? `${storageFiles} files` : ''}
        />
      </div>

      {/* Main Charts & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Bar Chart */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2937] p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1f2937]">
            <h3 className="font-semibold text-[#f8fafc]">System Metrics (Last 30 Days)</h3>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1">
              Active <ArrowUpRight size={14} />
            </span>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#14b8a6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#111827] border border-[#1f2937] p-6 rounded-2xl">
          <div className="mb-6 pb-4 border-b border-[#1f2937]">
            <h3 className="font-semibold text-[#f8fafc]">Platform Security Logs</h3>
          </div>
          
          <div className="space-y-5">
            {activities.length === 0 ? (
              <div className="text-center text-xs text-[#64748b] py-8">No recent security logs.</div>
            ) : (
              activities.map((act) => {
                const isDelete = act.action.includes('delete') || act.action.includes('reject');
                const isUpdate = act.action.includes('update') || act.action.includes('approve');
                const badgeColor = isDelete ? 'bg-red-500' : isUpdate ? 'bg-amber-500' : 'bg-teal-500';

                return (
                  <div key={act.id} className="border-l-2 border-[#1f2937] pl-4 relative">
                    <span className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ${badgeColor}`}></span>
                    <span className="text-[10px] text-[#64748b] font-medium block">
                      {new Date(act.created_at).toLocaleDateString()} @ {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs font-semibold text-[#f8fafc] block uppercase mt-0.5">
                      {act.action} — {act.resource || 'SYSTEM'}
                    </span>
                    <span className="text-[11px] text-[#94a3b8] truncate block mt-0.5">
                      {act.details || 'IP: ' + (act.details || 'N/A')}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
