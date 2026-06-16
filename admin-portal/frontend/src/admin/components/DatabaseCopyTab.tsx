import React, { useState } from 'react';
import { Database, Play, AlertTriangle } from 'lucide-react';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { copyDatabase, testDbConnection, type DbCopyTableResult, type DbTableInfo } from '../services/adminApi';

export const DatabaseCopyTab: React.FC = () => {
  const [sourceUrl, setSourceUrl] = useState('');
  const [tables, setTables] = useState<DbTableInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [testing, setTesting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [results, setResults] = useState<DbCopyTableResult[] | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const handleTest = async () => {
    if (!sourceUrl.trim()) return;
    setTesting(true);
    setTestMessage('');
    setResults(null);
    try {
      const res = await testDbConnection(sourceUrl.trim());
      setTables(res.data.tables);
      setSelected(new Set(res.data.tables.filter((t) => t.copyable).map((t) => t.name)));
      setTestMessage(res.data.ok ? 'Connection successful' : res.data.message);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setTestMessage(typeof msg === 'string' ? msg : 'Connection failed');
      setTables([]);
    } finally {
      setTesting(false);
    }
  };

  const toggleTable = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const runCopy = async () => {
    setCopying(true);
    setResults(null);
    try {
      const res = await copyDatabase({
        source_url: sourceUrl.trim(),
        tables: Array.from(selected),
        mode,
      });
      setResults(res.data.results);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setTestMessage(typeof msg === 'string' ? msg : 'Copy failed');
    } finally {
      setCopying(false);
      setConfirmReplace(false);
    }
  };

  const handleCopy = () => {
    if (selected.size === 0) return;
    if (mode === 'replace') {
      setConfirmReplace(true);
      return;
    }
    runCopy();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
        <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-[#94a3b8]">
          Database copy requires <code className="text-amber-400">ADMIN_DB_COPY_ENABLED=true</code> on the backend.
          Connection strings are never stored — used once per request.
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1f2937] p-6 rounded-2xl space-y-4">
        <label className="text-xs font-bold uppercase text-[#64748b] tracking-wider block">Source PostgreSQL URL</label>
        <input
          type="password"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="postgresql://user:pass@host:5432/dbname"
          className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg py-3 px-4 text-sm font-mono text-[#f8fafc] focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleTest}
          disabled={testing || !sourceUrl.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
        >
          <Database size={14} />
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        {testMessage && (
          <p className={`text-sm ${testMessage.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
            {testMessage}
          </p>
        )}
      </div>

      {tables.length > 0 && (
        <div className="bg-[#111827] border border-[#1f2937] p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-[#f8fafc]">Tables ({selected.size} selected)</h4>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}
              className="bg-[#0b0f19] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#f8fafc]"
            >
              <option value="merge">Merge (upsert on conflict)</option>
              <option value="replace">Replace (truncate first)</option>
            </select>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1 border border-[#1f2937] rounded-lg p-3">
            {tables.map((t) => (
              <label
                key={t.name}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[#1e293b] ${!t.copyable ? 'opacity-40' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(t.name)}
                  disabled={!t.copyable}
                  onChange={() => toggleTable(t.name)}
                />
                <span className="font-mono text-sm text-[#f8fafc]">{t.name}</span>
                <span className="text-xs text-[#64748b] ml-auto">{t.row_count.toLocaleString()} rows</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleCopy}
            disabled={copying || selected.size === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
          >
            <Play size={14} />
            {copying ? 'Copying...' : 'Run Copy'}
          </button>
        </div>
      )}

      {results && (
        <div className="bg-[#111827] border border-[#1f2937] p-6 rounded-2xl space-y-3">
          <h4 className="text-sm font-semibold text-[#f8fafc]">Copy Results</h4>
          {results.map((r) => (
            <div key={r.table} className="flex justify-between items-start text-sm border-b border-[#1f2937] pb-2">
              <span className="font-mono text-[#f8fafc]">{r.table}</span>
              <div className="text-right text-xs text-[#94a3b8]">
                <p>Copied: <span className="text-emerald-400">{r.copied}</span> · Skipped: {r.skipped}</p>
                {r.errors.length > 0 && (
                  <p className="text-rose-400 mt-1">{r.errors.join('; ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmReplace}
        title="Replace mode — confirm"
        message="Replace mode will TRUNCATE selected tables in the target database before copying. This cannot be undone."
        confirmLabel="Truncate & Copy"
        danger
        loading={copying}
        onConfirm={runCopy}
        onCancel={() => setConfirmReplace(false)}
      />
    </div>
  );
};
