import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from './StatCard';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-2xl',
}) => {
  const [shouldRender, setRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setRender(true);
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) setRender(false);
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full bg-[#0f172a] shadow-2xl border-l border-[#1f2937] flex flex-col transition-transform duration-300 ease-in-out",
          width,
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        onTransitionEnd={handleAnimationEnd}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#1f2937] bg-[#111827]">
          <div>
            <h2 className="text-xl font-bold text-[#f8fafc]">{title}</h2>
            {subtitle && <p className="text-sm text-[#94a3b8] mt-1">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {children}
        </div>
      </div>
    </>
  );
};
