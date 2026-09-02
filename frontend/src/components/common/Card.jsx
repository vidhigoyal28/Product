import React from 'react';

export default function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  footer,
  className = '',
  bodyClassName = '',
  variant = 'default',
}) {
  const variantStyles = {
    default: 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700/80',
    glass: 'glass-panel',
    highlight: 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-blue-500/20 shadow-lg shadow-blue-500/5',
    subtle: 'bg-slate-900/40 border-slate-800/40',
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${variantStyles[variant] || variantStyles.default} ${className}`}
    >
      {(title || Icon || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Icon size={18} />
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold text-slate-100 text-sm tracking-wide">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div className={`p-5 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-5 py-3.5 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
