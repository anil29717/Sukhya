import React, { useEffect, useState } from 'react';
import { HardDrive, Download, Eye, RefreshCw } from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { StatusPill } from './ui/StatusPill';
import { DataTable, type Column } from './ui/DataTable';
import {
  getStorageStats,
  getStorageHealth,
  listStorageFiles,
  downloadStorageFile,
  type StorageFileItem,
  type StorageHealth,
  type StorageStats,
} from '../services/adminApi';

export const StorageMonitorTab: React.FC = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [health, setHealth] = useState<StorageHealth | null>(null);
  const [files, setFiles] = useState<StorageFileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, healthRes, filesRes] = await Promise.all([
        getStorageStats(),
        getStorageHealth(),
        listStorageFiles({ page_size: 100 }),
      ]);
      setStats(statsRes.data);
      setHealth(healthRes.data);
      setFiles(filesRes.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const providerStatus = (name: string) => {
    const p = health?.providers.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (!p) return 'not_configured' as const;
    if (p.status === 'online') return 'online' as const;
    if (p.status === 'offline') return 'offline' as const;
    return 'not_configured' as const;
  };

  const columns: Column<StorageFileItem>[] = [
    { key: 'id', label: 'ID', render: (r) => `#${r.id}` },
    { key: 'patient_name', label: 'Patient', render: (r) => r.patient_name || `Patient #${r.patient_id}` },
    { key: 'title', label: 'Title' },
    { key: 'file_name', label: 'File', render: (r) => <span className="font-mono text-xs text-[#64748b]">{r.file_name}</span> },
    { key: 'provider', label: 'Provider', render: (r) => (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 uppercase">{r.provider}</span>
    )},
    { key: 'file_size', label: 'Size', render: (r) => `${(r.file_size / 1024).toFixed(1)} KB` },
    { key: 'created_at', label: 'Uploaded', render: (r) => new Date(r.created_at).toLocaleDateString() },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); downloadStorageFile(r); }}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-blue-400 hover:bg-blue-500/10"
            title="Download"
          >
            <Download size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-sm text-[#f8fafc] hover:bg-[#334155]"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Files" value={stats?.total_files ?? 0} icon={HardDrive} color="blue" />
        <StatCard label="Storage Used" value={`${stats?.total_mb?.toFixed(1) ?? 0} MB`} icon={HardDrive} color="indigo" />
        <div className="bg-[#111827] border border-[#1f2937] p-5 rounded-2xl flex flex-col justify-center gap-2">
          <p className="text-xs font-bold uppercase text-[#64748b] tracking-wider">Cloudinary</p>
          <StatusPill status={providerStatus('cloudinary')} label={providerStatus('cloudinary').replace('_', ' ')} />
        </div>
        <div className="bg-[#111827] border border-[#1f2937] p-5 rounded-2xl flex flex-col justify-center gap-2">
          <p className="text-xs font-bold uppercase text-[#64748b] tracking-wider">S3</p>
          <StatusPill status={providerStatus('s3')} label={providerStatus('s3').replace('_', ' ')} />
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111827] border border-[#1f2937] p-5 rounded-2xl">
            <h4 className="text-sm font-semibold text-[#f8fafc] mb-3">By Record Type</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(stats.by_record_type).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[#94a3b8]">
                  <span className="capitalize">{k.replace('_', ' ')}</span>
                  <span className="text-[#f8fafc] font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#111827] border border-[#1f2937] p-5 rounded-2xl">
            <h4 className="text-sm font-semibold text-[#f8fafc] mb-3">By Provider</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(stats.by_provider).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[#94a3b8]">
                  <span className="uppercase">{k}</span>
                  <span className="text-[#f8fafc] font-semibold">{v} files</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-[#f8fafc] mb-4 flex items-center gap-2">
          <Eye size={16} className="text-teal-400" /> File Browser
        </h4>
        <DataTable
          columns={columns}
          data={files}
          isLoading={loading}
          searchPlaceholder="Search files by patient, title, filename..."
          emptyStateMessage="No uploaded files found."
          pageSize={15}
          exportFileName="storage-files"
        />
      </div>
    </div>
  );
};
