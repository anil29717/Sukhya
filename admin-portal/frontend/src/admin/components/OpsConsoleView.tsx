import React, { useEffect, useState } from 'react';
import { HardDrive, Globe, Database, Settings, Check } from 'lucide-react';
import { StorageMonitorTab } from './StorageMonitorTab';
import { ApiExplorerTab } from './ApiExplorerTab';
import { DatabaseCopyTab } from './DatabaseCopyTab';
import { getApiUrl } from '../services/api';
import { getSystemInfo, type SystemInfo } from '../services/adminApi';

const TABS = [
  { id: 'storage', label: 'Storage Monitor', icon: HardDrive },
  { id: 'api', label: 'API Explorer', icon: Globe },
  { id: 'database', label: 'Database Copy', icon: Database },
  { id: 'settings', label: 'System Settings', icon: Settings },
] as const;

type TabId = (typeof TABS)[number]['id'];

export const OpsConsoleView: React.FC = () => {
  const [tab, setTab] = useState<TabId>('storage');
  const [apiVal, setApiVal] = useState(getApiUrl());
  const [saved, setSaved] = useState(false);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    getSystemInfo()
      .then((res) => setSysInfo(res.data))
      .catch(console.error);
  }, []);

  const handleSaveApi = () => {
    localStorage.setItem('admin_api_url', apiVal);
    setSaved(true);
    setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-[#1f2937] pb-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === id
                ? 'bg-[#1e293b] text-[#f8fafc] border border-teal-500/30'
                : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b]/50'
            }`}
          >
            <Icon size={16} className={tab === id ? 'text-teal-400' : ''} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'storage' && <StorageMonitorTab />}
      {tab === 'api' && <ApiExplorerTab />}
      {tab === 'database' && <DatabaseCopyTab />}
      {tab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-[#111827] border border-[#1f2937] p-6 rounded-2xl space-y-6">
            <h3 className="font-semibold text-[#f8fafc] border-b border-[#1f2937] pb-4">API Gateway</h3>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">API URL</label>
              <input
                type="text"
                value={apiVal}
                onChange={(e) => setApiVal(e.target.value)}
                className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg py-3 px-4 text-sm font-mono text-[#f8fafc] focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSaveApi}
              disabled={saved}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg disabled:opacity-70 flex items-center gap-2"
            >
              {saved ? <><Check size={16} /> Saved! Reloading...</> : 'Save Configuration'}
            </button>
          </div>

          {sysInfo && (
            <div className="bg-[#111827] border border-[#1f2937] p-6 rounded-2xl space-y-3 text-sm">
              <h3 className="font-semibold text-[#f8fafc] border-b border-[#1f2937] pb-4">Runtime Info (read-only)</h3>
              <div className="grid grid-cols-2 gap-3 text-[#94a3b8]">
                <p>App Version</p><p className="text-[#f8fafc] font-mono">{sysInfo.app_version}</p>
                <p>Storage Backend</p><p className="text-[#f8fafc] font-mono uppercase">{sysInfo.storage_backend}</p>
                <p>S3 Dual Write</p><p className="text-[#f8fafc]">{sysInfo.dual_write_s3 ? 'Enabled' : 'Disabled'}</p>
                <p>DB Copy Enabled</p><p className="text-[#f8fafc]">{sysInfo.db_copy_enabled ? 'Yes' : 'No'}</p>
                <p>Database Host</p><p className="text-[#f8fafc] font-mono">{sysInfo.database_host_masked}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
