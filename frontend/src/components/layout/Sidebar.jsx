import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  History,
  FileText,
  Settings,
  ShieldCheck,
  Scale
} from 'lucide-react';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/inspection/new',
    label: 'New Inspection',
    icon: ScanLine,
  },
  {
    to: '/history',
    label: 'History & Logs',
    icon: History,
  },
  {
    to: '/reports',
    label: 'Notices & Reports',
    icon: FileText,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="p-4 flex-1 space-y-1.5">
        <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Inspection Portal
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Statutory Authority Footer Card */}
      <div className="p-4 m-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Scale size={16} className="text-blue-400" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-300">
            PCR 2011 Standards
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Automated verification for packaged commodity statutory declarations.
        </p>
        <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Phase 1 Frontend</span>
          <span className="text-emerald-400 font-mono">v1.0-alpha</span>
        </div>
      </div>
    </aside>
  );
}
