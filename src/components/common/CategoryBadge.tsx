import React from 'react';
import { FindingCategory } from '../../types';
import { GitBranch, Clock, FileQuestion, Grid, Activity, FastForward, Shuffle } from 'lucide-react';

interface Props {
  category: FindingCategory;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<Props> = ({ category, size = 'md' }) => {
  const config = {
    'Execution Gap': { bg: 'bg-rose-950/50 border-rose-800 text-rose-300', icon: GitBranch },
    'SLA Breach': { bg: 'bg-amber-950/50 border-amber-800 text-amber-300', icon: Clock },
    'Missing Evidence': { bg: 'bg-purple-950/50 border-purple-800 text-purple-300', icon: FileQuestion },
    'Negative Space': { bg: 'bg-indigo-950/50 border-indigo-800 text-indigo-300', icon: Grid },
    'Anomaly': { bg: 'bg-cyan-950/50 border-cyan-800 text-cyan-300', icon: Activity },
    'Premature Closure': { bg: 'bg-orange-950/50 border-orange-800 text-orange-300', icon: FastForward },
    'Invalid Transition': { bg: 'bg-yellow-950/50 border-yellow-800 text-yellow-300', icon: Shuffle }
  }[category] || { bg: 'bg-zinc-800 border-zinc-700 text-zinc-300', icon: GitBranch };

  const Icon = config.icon;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <span className={`inline-flex items-center rounded border whitespace-nowrap ${config.bg} ${sizeClass}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{category}</span>
    </span>
  );
};
