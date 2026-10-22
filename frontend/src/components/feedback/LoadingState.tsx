// SPDX-License-Identifier: MIT
import React from 'react';

export interface LoadingStateProps {
  message?: string;
  description?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading telemetry data...',
  description = 'Connecting to canonical analytics core',
  className = '',
}) => {
  return (
    <div
      className={`glass-panel rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="relative flex items-center justify-center w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
      <h4 className="text-sm font-semibold text-slate-200 tracking-wide">{message}</h4>
      {description && (
        <p className="text-xs text-slate-400 mt-1 max-w-sm">{description}</p>
      )}
    </div>
  );
};
