// SPDX-License-Identifier: MIT
import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string;
  variant?: 'default' | 'ghost' | 'active';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  'aria-label': ariaLabel,
  variant = 'default',
  size = 'md',
  className = '',
  disabled,
  ...rest
}) => {
  const variantClasses = {
    default: 'glass-panel hover:bg-white/10 text-slate-300 hover:text-white border-white/10',
    ghost: 'bg-transparent hover:bg-white/5 text-slate-400 hover:text-white',
    active: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-sm shadow-cyan-950/50',
  }[variant];

  const sizeClasses = {
    sm: 'w-7 h-7 p-1 text-sm rounded-lg',
    md: 'w-9 h-9 p-1.5 text-base rounded-xl',
    lg: 'w-11 h-11 p-2 text-lg rounded-xl',
  }[size];

  return (
    <button
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
};
