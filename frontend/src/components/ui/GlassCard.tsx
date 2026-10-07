// SPDX-License-Identifier: MIT
import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'accent' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  headerClassName?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  padding = 'md',
  title,
  subtitle,
  badge,
  action,
  headerClassName = '',
  className = '',
  children,
  ...rest
}) => {
  const variantClasses = {
    default: 'glass-panel',
    subtle: 'glass-panel-subtle',
    accent: 'glass-panel-accent',
    interactive: 'glass-panel glass-card-interactive cursor-pointer',
  }[variant];

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding];

  const hasHeader = title || subtitle || badge || action;

  return (
    <div
      className={`rounded-2xl transition-all duration-200 ${variantClasses} ${paddingClasses} ${className}`}
      {...rest}
    >
      {hasHeader && (
        <div className={`flex items-start justify-between gap-4 mb-4 pb-3 border-b border-white/5 ${headerClassName}`}>
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2">
                {title}
                {badge}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
