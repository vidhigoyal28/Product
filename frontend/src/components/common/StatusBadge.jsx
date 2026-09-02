import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'md', showIcon = true, className = '' }) {
  const normalized = (status || '').toUpperCase();

  const configs = {
    COMPLIANT: {
      label: 'COMPLIANT',
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      icon: CheckCircle2,
      dot: 'bg-emerald-400',
    },
    NON_COMPLIANT: {
      label: 'NON-COMPLIANT',
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      icon: XCircle,
      dot: 'bg-rose-400',
    },
    NEEDS_REVIEW: {
      label: 'NEEDS REVIEW',
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      icon: AlertTriangle,
      dot: 'bg-amber-400',
    },
    PASS: {
      label: 'COMPLIANT',
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      icon: CheckCircle2,
      dot: 'bg-emerald-400',
    },
    FAIL: {
      label: 'NON-COMPLIANT',
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      icon: XCircle,
      dot: 'bg-rose-400',
    },
  };

  const config = configs[normalized] || {
    label: normalized || 'UNKNOWN',
    bg: 'bg-slate-700/30 border-slate-600 text-slate-300',
    icon: HelpCircle,
    dot: 'bg-slate-400',
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold tracking-wide',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold tracking-wider',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 18,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {showIcon && <IconComponent size={iconSizes[size] || 14} className="shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
