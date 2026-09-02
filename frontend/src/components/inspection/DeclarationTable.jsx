import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function DeclarationTable({ declarations = [], className = '' }) {
  if (!declarations || declarations.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
        No declaration extractions available.
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 ${className}`}>
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
          <tr>
            <th className="py-3.5 px-4">Mandatory Statutory Declaration</th>
            <th className="py-3.5 px-4">Extracted Label Text / Value</th>
            <th className="py-3.5 px-3 text-center">Status</th>
            <th className="py-3.5 px-3 text-center">Confidence</th>
            <th className="py-3.5 px-4">Rule Ref</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-200">
          {declarations.map((item, idx) => {
            const isPass = item.status === 'PASS';
            const isFail = item.status === 'FAIL';
            const isReview = item.status === 'NEEDS_REVIEW';

            return (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-100 flex items-center gap-2">
                  {isPass && <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />}
                  {isFail && <XCircle size={15} className="text-rose-400 shrink-0" />}
                  {isReview && <AlertCircle size={15} className="text-amber-400 shrink-0" />}
                  <span>{item.label}</span>
                </td>

                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 max-w-xs break-words">
                  {item.value}
                </td>

                <td className="py-3.5 px-3 text-center">
                  <StatusBadge status={item.status} size="sm" />
                </td>

                <td className="py-3.5 px-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.confidence >= 90
                            ? 'bg-emerald-500'
                            : item.confidence >= 70
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${item.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{item.confidence}%</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-slate-300">
                    {item.rulePlaceholder || 'Applicable Rule'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
