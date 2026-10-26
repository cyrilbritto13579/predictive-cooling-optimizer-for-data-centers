// SPDX-License-Identifier: MIT
import React from 'react';
import { ExternalLink, Snowflake } from 'lucide-react';
import { TopNav } from './TopNav';
import { StatusBadge } from '../ui/StatusBadge';
import { IconButton } from '../ui/IconButton';
import { env } from '../../config/environment';
import type { HealthResponse } from '../../types';

export interface HeaderProps {
  health?: HealthResponse | null;
  healthLoading?: boolean;
}

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ health, healthLoading }) => {
  const isHealthy = health?.status === 'healthy';
  const isDegraded = health?.status === 'degraded';

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Branding & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center p-1.5 shadow-sm shadow-cyan-950/40">
            <img
              src="/assets/logo.png"
              alt="Predictive Cooling Optimizer Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <Snowflake className="w-5 h-5 text-cyan-400 -ml-5 opacity-0 only:opacity-100" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                Predictive Cooling
              </span>
              <span className="hidden md:inline-flex text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Data Center
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              HVAC Predictive Intelligence
            </span>
          </div>
        </div>

        {/* Center: Top Navigation */}
        <div className="hidden lg:flex items-center justify-center flex-1">
          <TopNav />
        </div>

        {/* Right: Backend Status & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {healthLoading ? (
            <StatusBadge status="neutral" label="Connecting..." pulse={false} size="sm" />
          ) : isHealthy ? (
            <StatusBadge status="healthy" label="API Connected" pulse={true} size="sm" />
          ) : isDegraded ? (
            <StatusBadge status="warning" label="API Degraded" pulse={false} size="sm" />
          ) : (
            <StatusBadge status="offline" label="API Offline" pulse={false} size="sm" />
          )}

          <a
            href={env.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
          >
            <IconButton
              icon={<GithubIcon className="w-4 h-4" />}
              aria-label="GitHub Repository"
              size="sm"
            />
          </a>

          <a
            href={`${env.apiBaseUrl}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="FastAPI Swagger Documentation"
            className="hidden sm:inline-flex"
          >
            <IconButton
              icon={<ExternalLink className="w-4 h-4" />}
              aria-label="FastAPI Interactive Swagger Docs"
              size="sm"
            />
          </a>
        </div>
      </div>

      {/* Mobile / Tablet Navigation bar */}
      <div className="flex lg:hidden justify-center mt-2.5">
        <TopNav />
      </div>
    </header>
  );
};
