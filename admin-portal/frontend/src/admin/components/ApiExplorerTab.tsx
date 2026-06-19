import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { DataTable, type Column } from './ui/DataTable';
import { fetchOpenApi } from '../services/adminApi';
import { getApiUrl } from '../services/api';

interface ApiRoute {
  tag: string;
  method: string;
  path: string;
  summary: string;
  operationId: string;
}

export const ApiExplorerTab: React.FC = () => {
  const [routes, setRoutes] = useState<ApiRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const spec = await fetchOpenApi();
        const parsed: ApiRoute[] = [];
        for (const [path, methods] of Object.entries(spec.paths || {})) {
          for (const [method, op] of Object.entries(methods as Record<string, Record<string, unknown>>)) {
            if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
              parsed.push({
                tag: ((op.tags as string[]) || ['Other'])[0],
                method: method.toUpperCase(),
                path,
                summary: (op.summary as string) || (op.operationId as string) || '',
                operationId: (op.operationId as string) || '',
              });
            }
          }
        }
        setRoutes(parsed.sort((a, b) => a.tag.localeCompare(b.tag) || a.path.localeCompare(b.path)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return routes;
    const q = filter.toLowerCase();
    return routes.filter(
      (r) =>
        r.path.toLowerCase().includes(q) ||
        r.tag.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.method.toLowerCase().includes(q)
    );
  }, [routes, filter]);

  const methodColor = (m: string) => {
    const map: Record<string, string> = {
      GET: 'text-emerald-400 bg-emerald-500/10',
      POST: 'text-blue-400 bg-blue-500/10',
      PUT: 'text-amber-400 bg-amber-500/10',
      PATCH: 'text-purple-400 bg-purple-500/10',
      DELETE: 'text-rose-400 bg-rose-500/10',
    };
    return map[m] || 'text-slate-400 bg-slate-500/10';
  };

  const baseUrl = getApiUrl().replace('/api/v1', '');

  const columns: Column<ApiRoute>[] = [
    { key: 'tag', label: 'Tag', sortable: true, render: (r) => (
      <span className="text-xs font-semibold text-[#94a3b8]">{r.tag}</span>
    )},
    { key: 'method', label: 'Method', sortable: true, render: (r) => (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${methodColor(r.method)}`}>{r.method}</span>
    )},
    { key: 'path', label: 'Path', sortable: true, render: (r) => (
      <span className="font-mono text-xs text-[#f8fafc]">/api/v1{r.path}</span>
    )},
    { key: 'summary', label: 'Summary', render: (r) => (
      <span className="text-xs text-[#94a3b8] truncate block max-w-xs">{r.summary}</span>
    )},
    {
      key: 'link',
      label: 'Docs',
      render: (r) => (
        <a
          href={`${baseUrl}/docs#/${r.tag.replace(/\s+/g, '%20')}/${r.operationId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          onClick={(e) => e.stopPropagation()}
        >
          Swagger <ExternalLink size={12} />
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by path, tag, method..."
          className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#f8fafc] focus:outline-none focus:border-blue-500"
        />
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={loading}
        searchPlaceholder=""
        emptyStateMessage="No API routes found."
        pageSize={20}
        exportFileName="api-routes"
      />
    </div>
  );
};
