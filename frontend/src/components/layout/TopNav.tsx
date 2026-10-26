// SPDX-License-Identifier: MIT
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Cpu,
  Gauge,
  Home,
  Sliders,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
  { to: '/dashboard', label: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
  { to: '/prediction', label: 'Prediction', icon: <Gauge className="w-4 h-4" /> },
  { to: '/optimization', label: 'Optimization', icon: <Sliders className="w-4 h-4" /> },
  { to: '/models', label: 'Models', icon: <Cpu className="w-4 h-4" /> },
];

export const TopNav: React.FC = () => {
  return (
    <nav className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl glass-panel-subtle" aria-label="Main Navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 select-none ${
              isActive
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-sm shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
