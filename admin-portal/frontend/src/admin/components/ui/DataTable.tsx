import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from './StatCard';

export type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
};

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyStateMessage?: string;
  pageSize?: number;
  onAdd?: () => void;
  addLabel?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  exportFileName?: string;
}

function escapeCsv(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  onRowClick,
  isLoading = false,
  emptyStateMessage = 'No data available',
  pageSize = 10,
  onAdd,
  addLabel = 'Add',
  onEdit,
  onDelete,
  exportFileName = 'export',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' } | null>(null);

  const showActions = Boolean(onEdit || onDelete);

  const handleSort = (key: keyof T | string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let filtered = [...data];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item as object).some((val) => String(val).toLowerCase().includes(lowerQuery))
      );
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aRec = a as Record<string, unknown>;
        const bRec = b as Record<string, unknown>;
        const aValue = aRec[sortConfig.key as string];
        const bValue = bRec[sortConfig.key as string];
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchQuery, sortConfig]);

  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const currentData = processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleExportCsv = () => {
    const headers = columns.map((c) => escapeCsv(c.label)).join(',');
    const rows = processedData.map((row) =>
      columns
        .map((col) => {
          const raw = col.render ? undefined : (row as Record<string, unknown>)[col.key as string];
          return escapeCsv(raw ?? '');
        })
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const colSpan = columns.length + (showActions ? 1 : 0);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row gap-4 bg-[#111827] border border-[#1f2937] p-5 rounded-2xl justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg py-2.5 pl-11 pr-4 text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-blue-500 transition-colors"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus size={14} />
              {addLabel}
            </button>
          )}
          <button
            onClick={handleExportCsv}
            disabled={processedData.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e293b] border border-[#334155] hover:bg-[#334155] text-[#f8fafc] rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-[#1e293b]/50 border-b border-[#1f2937]">
              {columns.map((col, index) => (
                <th
                  key={String(col.key) + index}
                  className={cn(
                    'px-6 py-4 text-xs font-semibold uppercase text-[#94a3b8]',
                    col.sortable && 'cursor-pointer hover:text-[#f8fafc] transition-colors'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && (
                      <ArrowUpDown
                        size={12}
                        className={cn(sortConfig?.key === col.key ? 'text-blue-500' : 'text-[#64748b]')}
                      />
                    )}
                  </div>
                </th>
              ))}
              {showActions && (
                <th className="px-6 py-4 text-xs font-semibold uppercase text-[#94a3b8] w-24">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2937]">
            {isLoading ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-20 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-teal-500" />
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-20 text-center text-[#64748b]">
                  {emptyStateMessage}
                </td>
              </tr>
            ) : (
              currentData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn('hover:bg-white/[0.02] transition-colors', onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-[#f8fafc] font-medium">
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-sm text-[#94a3b8] px-2">
        <span>
          Showing {currentData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} entries
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage <= 1 || isLoading}
            className="p-2 bg-[#1e293b] border border-[#334155] text-[#f8fafc] hover:bg-[#334155] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center px-4 font-semibold text-xs bg-[#1e293b] border border-[#334155] rounded-lg">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages || isLoading}
            className="p-2 bg-[#1e293b] border border-[#334155] text-[#f8fafc] hover:bg-[#334155] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
