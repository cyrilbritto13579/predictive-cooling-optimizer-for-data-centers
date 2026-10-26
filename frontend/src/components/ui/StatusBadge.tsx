// SPDX-License-Identifier: MIT
import React from 'react';

export type StatusType = 'healthy' | 'online' | 'degraded' | 'warning' | 'offline' | 'error' | 'info' | 'neutral';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showDot?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showDot = true,
  pulse = false,
  size = 'md',
  className = '',
}) => {
  const isPositive = status === 'healthy' || status === 'online';
  const isWarning = status === 'degraded' || status === 'warning';
  const isNegative = status === 'offline' || status === 'error';

  const colorStyles = isPositive
    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
    : isWarning
    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
    : isNegative
    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
    : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300';

  const dotColor = isPositive
    ? 'bg-emerald-400'
    : isWarning
    ? 'bg-amber-400'
    : isNegative
    ? 'bg-rose-400'
    : 'bg-cyan-400';

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  const displayLabel =
    label ??
    (isPositive
      ? 'Connected'
      : isWarning
      ? 'Degraded'
      : isNegative
      ? 'Offline'
      : status.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border backdrop-blur-md ${colorStyles} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {pulse && isPositive && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
      )}
      <span>{displayLabel}</span>
    </span>
  );
};
