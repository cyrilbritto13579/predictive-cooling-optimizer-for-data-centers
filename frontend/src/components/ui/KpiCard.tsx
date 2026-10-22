// SPDX-License-Identifier: MIT
import React from 'react';
import { GlassCard } from './GlassCard';

export interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string | number;
    trend?: 'up' | 'down' | 'neutral' | 'positive' | 'warning';
    label?: string;
  };
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: 'default' | 'subtle' | 'accent';
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  delta,
  subtitle,
  icon,
  badge,
  variant = 'default',
  className = '',
}) => {
  return (
    <GlassCard variant={variant} padding="sm" className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && (
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-cyan-400">
              {icon}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-white number-mono">
          {value}
        </span>
        {unit && (
          <span className="text-xs sm:text-sm font-medium text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {(delta || subtitle) && (
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
          {delta && (
            <div className="flex items-center gap-1">
              <span
                className={`font-medium ${
                  delta.trend === 'positive' || delta.trend === 'up'
                    ? 'text-emerald-400'
                    : delta.trend === 'warning'
                    ? 'text-amber-400'
                    : delta.trend === 'down'
                    ? 'text-cyan-400'
                    : 'text-slate-400'
                }`}
              >
                {delta.value}
              </span>
              {delta.label && <span className="text-slate-500 text-[11px]">{delta.label}</span>}
            </div>
          )}
          {subtitle && <span className="text-slate-400 text-[11px] truncate">{subtitle}</span>}
        </div>
      )}
    </GlassCard>
  );
};
