import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Plus, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Brand & Context */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm md:text-base tracking-tight">
                Legal Metrology Inspector
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                SIH26034
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Packaged Commodities Compliance System (PCR 2011)
            </p>
          </div>
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <Link
          to="/inspection/new"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus size={16} />
          <span>New Inspection</span>
        </Link>

        {/* System Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-medium text-[11px]">Engine: Ready (Mock v1)</span>
        </div>

        {/* User Info / Profile Menu */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-slate-200">{user?.name || 'Inspector'}</p>
            <p className="text-[10px] text-slate-400">{user?.badgeNumber || 'Officer'}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User size={16} />
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
