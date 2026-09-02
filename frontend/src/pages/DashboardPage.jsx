import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.dashboard.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-mono">Loading compliance telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero Callout */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-900/40 via-slate-900/90 to-indigo-950/50 border border-blue-500/20 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              <Sparkles size={14} />
              <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Automated Package Compliance Inspector
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Verify statutory declarations, MRP & tax clauses, font size compliance, net quantity standards, and consumer grievance blocks in seconds.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/inspection/new"
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <ScanLine size={18} />
              <span>Start New Inspection</span>
            </Link>

            <Link
              to="/history"
              className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <span>View Past Logs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inspected */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Inspected
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-100 font-mono">
              {stats.totalInspections}
            </span>
            <span className="text-xs text-slate-400 font-medium">samples logged</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Health Rate:</span>
            <span className="text-emerald-400 font-mono font-semibold">{stats.complianceRate}% Compliant</span>
          </div>
        </div>

        {/* Compliant Packages */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Compliant
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400 font-mono">
              {stats.compliantCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">passed all checks</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Status:</span>
            <span className="text-emerald-400 font-medium">Valid for distribution</span>
          </div>
        </div>

        {/* Non-Compliant Packages */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Non-Compliant
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <XCircle size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-400 font-mono">
              {stats.nonCompliantCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">violations flagged</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Action Required:</span>
            <span className="text-rose-400 font-medium">Issue Notice</span>
          </div>
        </div>

        {/* Needs Review */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Needs Review
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400 font-mono">
              {stats.needsReviewCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">pending verification</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Officer Queue:</span>
            <span className="text-amber-400 font-medium">Manual audit needed</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Inspections & Frequently Detected Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Inspections */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Recent Sample Inspections
              </h2>
              <p className="text-xs text-slate-400">Latest packaged goods assessed under PCR 2011</p>
            </div>
            <Link
              to="/history"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
            <div className="divide-y divide-slate-800/80">
              {stats.recentInspections.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-950"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-xs hover:text-blue-400 transition-colors">
                          {item.productName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">({item.id})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-mono">Conf: {item.confidenceScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} size="sm" />
                    <Link
                      to={`/inspection/${item.id}/results`}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors"
                      title="View Details"
                    >
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Frequently Flagged Violations & Category Distribution */}
        <div className="space-y-6">
          {/* Violations Frequency */}
          <Card
            title="Commonly Flagged Non-Compliances"
            subtitle="Rule discrepancy trends across inspected commodities"
            icon={AlertTriangle}
          >
            <div className="space-y-3">
              {stats.frequentViolations.map((viol, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-200">{viol.title}</p>
                    <span className="text-[10px] font-mono text-slate-400">{viol.rulePlaceholder}</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono font-bold text-xs">
                    {viol.count} cases
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Legal Metrology Statutory Guide Note */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
              <ShieldCheck size={16} />
              <span>Statutory Inspection Protocol</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every retail package must display 9 mandatory declarations on the principal display panel without obstruction, conforming to numeral height standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
