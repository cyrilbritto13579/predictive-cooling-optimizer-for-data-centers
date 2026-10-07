// SPDX-License-Identifier: MIT
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  detail?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Service Error',
  message,
  detail,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`glass-panel border-rose-500/30 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center max-w-lg mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-rose-200">{title}</h4>
      <p className="text-sm text-slate-300 mt-1 max-w-md">{message}</p>
      {detail && (
        <pre className="mt-3 p-3 bg-slate-950/60 rounded-lg text-xs text-rose-300/80 font-mono text-left w-full overflow-x-auto border border-rose-500/10">
          {detail}
        </pre>
      )}
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
};
