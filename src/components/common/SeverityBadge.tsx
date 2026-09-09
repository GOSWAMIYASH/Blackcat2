import React from 'react';
import { SeverityLevel } from '../../types';
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface Props {
  severity: SeverityLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<Props> = ({ severity, showIcon = true, size = 'md' }) => {
  const normalized = severity?.toUpperCase() as SeverityLevel;

  const config = {
    CRITICAL: {
      bg: 'bg-red-950/70 border-red-700/60 text-red-300 shadow-sm shadow-red-950/50',
      icon: ShieldAlert,
      label: 'Critical'
    },
    HIGH: {
      bg: 'bg-orange-950/70 border-orange-700/60 text-orange-300 shadow-sm shadow-orange-950/50',
      icon: AlertTriangle,
      label: 'High'
    },
    MEDIUM: {
      bg: 'bg-amber-950/70 border-amber-700/60 text-amber-300',
      icon: AlertCircle,
      label: 'Medium'
    },
    LOW: {
      bg: 'bg-blue-950/70 border-blue-700/60 text-blue-300',
      icon: Info,
      label: 'Low'
    }
  }[normalized] || {
    bg: 'bg-zinc-800 border-zinc-700 text-zinc-300',
    icon: Info,
    label: severity
  };

  const Icon = config.icon;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded border tracking-wide whitespace-nowrap uppercase ${config.bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
