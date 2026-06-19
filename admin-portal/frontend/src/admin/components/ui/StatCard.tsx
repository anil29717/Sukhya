import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'teal' | 'purple' | 'amber' | 'emerald' | 'sky' | 'indigo';
}

const colorMap = {
  blue: 'bg-blue-500/10 text-blue-500',
  teal: 'bg-teal-500/10 text-teal-500',
  purple: 'bg-purple-500/10 text-purple-500',
  amber: 'bg-amber-500/10 text-amber-500',
  emerald: 'bg-emerald-500/10 text-emerald-500',
  sky: 'bg-sky-500/10 text-sky-500',
  indigo: 'bg-indigo-500/10 text-indigo-400',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
}) => {
  return (
    <div className="bg-[#1e293b] border border-[#334155] p-6 rounded-2xl flex flex-col hover:border-[#64748b] transition-all duration-150">
      <div className="flex items-center gap-5 mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorMap[color])}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-3xl font-bold text-[#f8fafc]">{value}</h3>
          <p className="text-xs text-[#94a3b8] font-medium">{label}</p>
        </div>
      </div>
      
      {trendValue && (
        <div className="pt-3 border-t border-[#334155] flex items-center gap-2">
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' :
            trend === 'down' ? 'bg-rose-500/10 text-rose-500' :
            'bg-[#334155]/50 text-[#94a3b8]'
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
          <span className="text-[10px] text-[#64748b] uppercase tracking-wider">vs last month</span>
        </div>
      )}
    </div>
  );
};
