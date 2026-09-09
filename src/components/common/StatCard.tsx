import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'warning' | 'info' | 'success';
  onClick?: () => void;
}

export const StatCard: React.FC<Props> = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  onClick
}) => {
  const variantStyles = {
    default: 'border-zinc-800 bg-zinc-900/80 text-zinc-100 hover:border-zinc-700',
    danger: 'border-red-900/50 bg-red-950/20 text-red-100 hover:border-red-800',
    warning: 'border-amber-900/50 bg-amber-950/20 text-amber-100 hover:border-amber-800',
    info: 'border-blue-900/50 bg-blue-950/20 text-blue-100 hover:border-blue-800',
    success: 'border-emerald-900/50 bg-emerald-950/20 text-emerald-100 hover:border-emerald-800'
  }[variant];

  const iconColors = {
    default: 'text-zinc-400 bg-zinc-800/80',
    danger: 'text-red-400 bg-red-950/80 border border-red-800/40',
    warning: 'text-amber-400 bg-amber-950/80 border border-amber-800/40',
    info: 'text-blue-400 bg-blue-950/80 border border-blue-800/40',
    success: 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/40'
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-4 transition-all duration-150 flex flex-col justify-between ${variantStyles} ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-md ${iconColors}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {subtext && <div className="text-xs text-zinc-400 mt-1">{subtext}</div>}
      </div>
    </div>
  );
};
