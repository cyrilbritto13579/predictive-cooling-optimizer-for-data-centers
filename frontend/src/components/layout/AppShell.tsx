// SPDX-License-Identifier: MIT
import React, { useEffect, useState } from 'react';
import { Header } from './Header';
import { getHealth } from '../../api/health';
import type { HealthResponse } from '../../types';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await getHealth();
        if (isMounted) {
          setHealth(res);
        }
      } catch {
        if (isMounted) {
          setHealth({
            status: 'offline',
            version: '1.0.0',
            core_available: false,
            models_loaded: false,
            models: { energy_model: false, temperature_model: false },
          });
        }
      } finally {
        if (isMounted) {
          setHealthLoading(false);
        }
      }
    }

    checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* 1. Viewport Data Center Background Layer */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-opacity duration-700"
        style={{
          backgroundImage: "url('/assets/background_1.jpg')",
          backgroundAttachment: 'fixed',
        }}
      />

      {/* 2. Dark Vignette / Translucent Overlay for Contrast & Readability */}
      <div className="fixed inset-0 z-0 bg-vignette pointer-events-none" />

      {/* 3. Top Navigation Header */}
      <Header health={health} healthLoading={healthLoading} />

      {/* 4. Centered Responsive Main Content Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full flex-1 flex flex-col">
        {children}
      </main>

      {/* 5. Minimal Engineering Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 py-4 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Predictive Cooling Optimizer</span>
            <span>•</span>
            <span>Temperature-Aware Chiller Scheduling</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI Core: v1.0.0</span>
            <span>•</span>
            <span>XGBoost Dual-Model Pipeline</span>
            <span>•</span>
            <span className="text-slate-400">MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
