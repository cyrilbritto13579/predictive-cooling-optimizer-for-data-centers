// SPDX-License-Identifier: MIT
import React from 'react';
import { Database, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  message,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`glass-panel-subtle rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-4">
        {icon || <Database className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
