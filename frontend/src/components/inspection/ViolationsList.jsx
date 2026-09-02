import React from 'react';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function ViolationsList({ violations = [], className = '' }) {
  if (!violations || violations.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-center gap-3 text-emerald-300">
        <CheckCircle2 size={24} className="shrink-0 text-emerald-400" />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider">No Violations Detected</h4>
          <p className="text-xs text-emerald-400/90 mt-0.5">
            All mandatory statutory declarations and label requirements are satisfied.
          </p>
        </div>
      </div>
    );
  }

  const severityConfigs = {
    HIGH: {
      border: 'border-rose-500/30 bg-rose-500/10',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: AlertOctagon,
      iconColor: 'text-rose-400',
    },
    MEDIUM: {
      border: 'border-amber-500/30 bg-amber-500/10',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    LOW: {
      border: 'border-blue-500/30 bg-blue-500/10',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      icon: Info,
      iconColor: 'text-blue-400',
    },
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {violations.map((violation, idx) => {
        const sev = violation.severity || 'MEDIUM';
        const config = severityConfigs[sev] || severityConfigs.MEDIUM;
        const IconComponent = config.icon;

        return (
          <div
            key={violation.id || idx}
            className={`rounded-xl border p-4 transition-all ${config.border}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <IconComponent size={18} className={`${config.iconColor} shrink-0 mt-0.5`} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-xs font-bold text-slate-100">{violation.title}</h5>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badge}`}
                    >
                      {sev} SEVERITY
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {violation.description}
                  </p>
                </div>
              </div>

              {/* Placeholder rule reference as strictly requested */}
              <div className="shrink-0 text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/80 text-[11px] font-mono text-slate-300">
                  {violation.rule || 'Applicable Rule'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
