import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Eye,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  Building,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportDetails, setReportDetails] = useState(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await api.reports.list();
        setReports(data);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleOpenReport = async (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
    try {
      const details = await api.reports.getReportDetails(report.inspectionId);
      setReportDetails(details);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.reportId.toLowerCase().includes(search.toLowerCase()) ||
      r.inspectionId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Official Notices & Audit Reports</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              Form II Compliance Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official statutory notices generated under Legal Metrology (Packaged Commodities) Rules, 2011
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Printer size={15} />
          <span>Print Summary</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md bg-slate-900/80 rounded-xl border border-slate-800">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Report ID, Product, or Sample ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border-none text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReports.map((report) => {
          const isPass = report.status === 'COMPLIANT';
          const isFail = report.status === 'NON_COMPLIANT';

          return (
            <div
              key={report.reportId}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-400" />
                    <span className="font-mono text-xs font-bold text-slate-200">{report.reportId}</span>
                  </div>
                  <StatusBadge status={report.status} size="sm" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{report.productName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{report.category}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Inspection ID:</span>
                    <span className="font-mono text-slate-200">{report.inspectionId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Violations Flagged:</span>
                    <span
                      className={`font-mono font-bold ${
                        report.violationsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {report.violationsCount} issues
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Issued Date:</span>
                    <span className="text-slate-300">{new Date(report.dateGenerated).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{report.officer}</span>
                <button
                  onClick={() => handleOpenReport(report)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye size={14} />
                  <span>View Notice</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Notice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Official Notice: ${selectedReport?.reportId || 'Inspection Report'}`}
        subtitle="Department of Consumer Affairs • Legal Metrology Division"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Printer size={15} />
              <span>Print Official Copy</span>
            </button>
          </>
        }
      >
        {reportDetails && (
          <div className="p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 space-y-6 print:bg-white print:text-black">
            {/* Header */}
            <div className="text-center border-b border-slate-800 pb-4">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                {reportDetails.department}
              </p>
              <h2 className="text-base font-extrabold uppercase mt-1">
                Statutory Compliance Audit Certificate
              </h2>
              <p className="text-xs text-blue-400 font-mono mt-0.5">
                Report Identifier: {reportDetails.reportId}
              </p>
            </div>

            {/* Content summary */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs leading-relaxed">
              <p className="font-semibold text-slate-200 mb-1">Executive Compliance Determination:</p>
              <p className="text-slate-300">{reportDetails.complianceSummary}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400">Target Sample:</p>
                <p className="font-bold text-slate-200">{reportDetails.inspection.productName}</p>
                <p className="text-slate-400 mt-1">Reference Code: {reportDetails.inspection.referenceId}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Verification Verdict:</p>
                <p className="font-bold text-slate-200">{reportDetails.inspection.status}</p>
                <p className="text-slate-400 mt-1">Audited by: {reportDetails.inspection.officer}</p>
              </div>
            </div>

            {/* Violations */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 border-b border-slate-800 pb-1">
                Statutory Violations Logged
              </h4>
              {reportDetails.inspection.violations.length === 0 ? (
                <p className="text-xs text-emerald-400">No violations observed on Principal Display Panel.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {reportDetails.inspection.violations.map((v, i) => (
                    <div key={i} className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">• {v.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{v.description}</p>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{v.rule}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signatory Footer */}
            <div className="pt-6 border-t border-slate-800 flex justify-between items-end text-xs">
              <div>
                <p className="text-[10px] text-slate-400">SIH 2026 Problem Statement SIH26034</p>
                <p className="text-[10px] text-slate-400">Digital Metrology Verification Division</p>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-slate-600 mb-1"></div>
                <p className="font-bold">{reportDetails.inspection.officer}</p>
                <p className="text-[10px] text-slate-400">Authorized Enforcement Officer</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
