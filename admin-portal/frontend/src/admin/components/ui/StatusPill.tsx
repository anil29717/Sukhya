import { cn } from './StatCard';

interface StatusPillProps {
  status: 'online' | 'offline' | 'not_configured' | 'degraded';
  label: string;
}

const styles: Record<StatusPillProps['status'], string> = {
  online: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  offline: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  not_configured: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  degraded: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export function StatusPill({ status, label }: StatusPillProps) {
  return (
    <span className={cn('px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider', styles[status])}>
      {label}
    </span>
  );
}
