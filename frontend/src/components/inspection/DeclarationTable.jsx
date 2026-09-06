import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function DeclarationTable({
  declarations = [],
  className = ''
}) {
  if (!declarations || declarations.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
        No declaration extractions available.
      </div>
    );
  }

  const getFieldLabel = (item) => {
    const field = item.field_name || item.key || '';

    const labels = {
      commodity_name: 'Common / Generic Name',
      generic_name: 'Common / Generic Name',
      net_quantity: 'Net Quantity',
      mrp: 'Maximum Retail Price',
      unit_sale_price: 'Unit Sale Price (USP)',
      manufacturer_details: 'Manufacturer Name & Address',
      importer_details: 'Importer / Packer Details',
      customer_care: 'Consumer Care / Grievance Cell',
      date_of_packing: 'Month & Year of Mfg / Packing',
      date_of_import: 'Month & Year of Import',
      country_of_origin: 'Country of Origin',
      font_height_compliance: 'Font & Numeral Size Compliance'
    };

    return (
      labels[field] ||
      field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()) ||
      'Declaration'
    );
  };

  const getFieldValue = (item) => {
    return (
      item.normalized_value ||
      item.raw_text ||
      item.value ||
      'Not detected'
    );
  };

  const getConfidence = (item) => {
    const confidence = Number(item.confidence);

    if (Number.isNaN(confidence)) {
      return 0;
    }

    return Math.max(0, Math.min(100, confidence));
  };

  const getStatus = (item) => {
    if (item.status) {
      return item.status;
    }

    return 'NEEDS_REVIEW';
  };

  const getRuleReference = (item) => {
    return (
      item.rulePlaceholder ||
      item.rule_clause_reference ||
      item.rule?.rule_clause_reference ||
      'Applicable Rule'
    );
  };

  return (
    <div
      className={`overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 ${className}`}
    >
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
          <tr>
            <th className="py-3.5 px-4">
              Mandatory Statutory Declaration
            </th>

            <th className="py-3.5 px-4">
              Extracted Label Text / Value
            </th>

            <th className="py-3.5 px-3 text-center">
              Status
            </th>

            <th className="py-3.5 px-3 text-center">
              Confidence
            </th>

            <th className="py-3.5 px-4">
              Rule Ref
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-800/60 text-slate-200">
          {declarations.map((item, idx) => {
            const status = getStatus(item);
            const confidence = getConfidence(item);

            const isPass = status === 'PASS';
            const isFail = status === 'FAIL';
            const isReview = status === 'NEEDS_REVIEW';

            return (
              <tr
                key={item.id || `${item.field_name || item.key}-${idx}`}
                className="hover:bg-slate-800/40 transition-colors"
              >
                {/* Declaration name */}
                <td className="py-3.5 px-4 font-medium text-slate-100">
                  <div className="flex items-center gap-2">
                    {isPass && (
                      <CheckCircle2
                        size={15}
                        className="text-emerald-400 shrink-0"
                      />
                    )}

                    {isFail && (
                      <XCircle
                        size={15}
                        className="text-rose-400 shrink-0"
                      />
                    )}

                    {isReview && (
                      <AlertCircle
                        size={15}
                        className="text-amber-400 shrink-0"
                      />
                    )}

                    {!isPass && !isFail && !isReview && (
                      <HelpCircle
                        size={15}
                        className="text-slate-400 shrink-0"
                      />
                    )}

                    <span>
                      {getFieldLabel(item)}
                    </span>
                  </div>
                </td>

                {/* OCR extracted value */}
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 max-w-xs break-words">
                  {getFieldValue(item)}
                </td>

                {/* Status */}
                <td className="py-3.5 px-3 text-center">
                  <StatusBadge
                    status={status}
                    size="sm"
                  />
                </td>

                {/* Confidence */}
                <td className="py-3.5 px-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          confidence >= 90
                            ? 'bg-emerald-500'
                            : confidence >= 70
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{
                          width: `${confidence}%`
                        }}
                      />
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      {confidence.toFixed(1)}%
                    </span>
                  </div>
                </td>

                {/* Rule reference */}
                <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-slate-300">
                    {getRuleReference(item)}
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