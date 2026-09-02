import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Printer,
  Edit3,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Share2,
  Calendar,
  UserCheck,
  Package,
  Layers,
  Sparkles,
  AlertOctagon
} from 'lucide-react';
import { useInspection } from '../context/InspectionContext';
import StatusBadge from '../components/common/StatusBadge';
import EvidenceViewer from '../components/inspection/EvidenceViewer';
import DeclarationTable from '../components/inspection/DeclarationTable';
import ViolationsList from '../components/inspection/ViolationsList';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInspection, updateReview } = useInspection();

  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Officer Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  // Official Report Preview Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getInspection(id);
        setInspection(data);
        setOverrideStatus(data.status);
        if (data.review?.officerNotes) {
          setReviewNotes(data.review.officerNotes);
        }
      } catch (err) {
        console.error('Failed to load results', err);
        setError('Failed to retrieve inspection record.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, getInspection]);

  const handleSaveReview = async () => {
    setIsSavingReview(true);
    try {
      const updated = await updateReview(id, {
        officerNotes: reviewNotes,
        overrideStatus: overrideStatus !== inspection.status ? overrideStatus : undefined,
        actionTaken: 'OFFICER_CONFIRMED'
      });
      setInspection(updated);
      setIsReviewModalOpen(false);
    } catch (err) {
      console.error('Failed to save review', err);
    } finally {
      setIsSavingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-mono">Loading compliance dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="max-w-md mx-auto p-6 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-center space-y-4">
        <AlertOctagon size={36} className="text-rose-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-100">{error || 'Inspection not found'}</h3>
        <Link
          to="/dashboard"
          className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isCompliant = inspection.status === 'COMPLIANT';
  const isNonCompliant = inspection.status === 'NON_COMPLIANT';
  const isNeedsReview = inspection.status === 'NEEDS_REVIEW';

  return (
    <div className="space-y-8">
      {/* Navigation Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/history')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Back to History"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-100">
                Compliance Verification Dossier
              </h1>
              <span className="text-xs font-mono text-slate-400">({inspection.id})</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ref: <span className="font-mono text-slate-300">{inspection.referenceId}</span> • Assessed on{' '}
              {new Date(inspection.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons: Review & Generate Report */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Edit3 size={15} className="text-blue-400" />
            <span>Officer Review</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <FileText size={15} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Main Verdict Card */}
      <div
        className={`rounded-2xl border p-6 relative overflow-hidden ${
          isCompliant
            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-xl shadow-emerald-500/5'
            : isNonCompliant
            ? 'bg-rose-950/20 border-rose-500/40 shadow-xl shadow-rose-500/5'
            : 'bg-amber-950/20 border-amber-500/40 shadow-xl shadow-amber-500/5'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Status Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusBadge status={inspection.status} size="lg" />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs font-mono text-slate-300">
                <span>Confidence:</span>
                <span className="font-bold text-blue-400">{inspection.confidenceScore}%</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-100">
                {inspection.productName}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Category: <span className="font-semibold text-slate-200">{inspection.category}</span> •
                Enforcement Target: <span className="font-mono text-slate-300">PCR 2011 Mandatory Declarations</span>
              </p>
            </div>

            {/* Statutory Summary Text */}
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isCompliant &&
                'All 9 mandatory packaging declarations, statutory phrasing, numeral font dimensions, and consumer care details conform to Legal Metrology requirements.'}
              {isNonCompliant &&
                `Automated verification flagged ${inspection.violations.length} statutory non-compliances requiring enforcement intervention or notice issuance.`}
              {isNeedsReview &&
                'Automated confidence is below standard verification threshold due to label optical conditions. Manual officer appraisal required.'}
            </p>
          </div>

          {/* Officer Verification Summary Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2 shrink-0 min-w-[240px]">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <UserCheck size={14} className="text-blue-400" />
              <span>Officer Sign-off</span>
            </div>
            <p className="font-semibold text-slate-200">{inspection.officer || 'Inspector R. Sharma'}</p>
            <p className="text-[11px] text-slate-400">
              Audit Status: <span className="text-slate-300 font-mono">{inspection.review?.isReviewed ? 'Reviewed & Signed' : 'Pending Officer Review'}</span>
            </p>
            {inspection.review?.officerNotes && (
              <p className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded border border-amber-500/20 italic">
                "{inspection.review.officerNotes}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Evidence Viewer & Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 5 Cols: Visual Evidence Viewer */}
        <div className="lg:col-span-5 space-y-4">
          <EvidenceViewer
            imageUrl={inspection.imageUrl}
            boundingBoxes={inspection.boundingBoxes || []}
            productName={inspection.productName}
          />

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
            <span className="font-semibold text-slate-300 text-xs block">
              PDP Dimensions & OCR Regions
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Bounding boxes demarcate detected statutory zones. Numeral heights and character dimensions are measured against the total display area.
            </p>
          </div>
        </div>

        {/* Right 7 Cols: Violations & Declarations Table */}
        <div className="lg:col-span-7 space-y-6">
          {/* Violations Block */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                <span>Detected Violations & Non-Compliances</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                ({inspection.violations.length} flagged)
              </span>
            </div>

            <ViolationsList violations={inspection.violations} />
          </div>

          {/* Mandatory Declarations Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-400" />
                <span>Mandatory Declarations Audit</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {inspection.declarations.filter((d) => d.status === 'PASS').length} of {inspection.declarations.length} Passed
              </span>
            </div>

            <DeclarationTable declarations={inspection.declarations} />
          </div>
        </div>
      </div>

      {/* OFFICER REVIEW MODAL */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Officer Inspection Review & Status Override"
        subtitle={`Audit Record: ${inspection.id} • ${inspection.productName}`}
        footer={
          <>
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReview}
              disabled={isSavingReview}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
            >
              {isSavingReview ? 'Saving...' : 'Save & Sign Review'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Verified Compliance Status (Override if necessary)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['COMPLIANT', 'NON_COMPLIANT', 'NEEDS_REVIEW'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOverrideStatus(st)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                    overrideStatus === st
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <StatusBadge status={st} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enforcement Officer Remarks & Field Notes
            </label>
            <textarea
              rows={4}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Enter official observation notes, physical package inspection observations, or exemption citations..."
              className="w-full p-3 rounded-xl bg-slate-950/60 border border-slate-700/80 text-slate-100 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Legal Metrology Officer Sign-off:</span> Changes will be timestamped and permanently logged in the inspection audit trail.
          </div>
        </div>
      </Modal>

      {/* OFFICIAL REPORT PREVIEW MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Official Legal Metrology Inspection Notice & Dossier"
        subtitle="Form II - Packaged Commodities Statutory Audit Report"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Printer size={15} />
              <span>Print Official Notice</span>
            </button>
          </>
        }
      >
        {/* Printable Official Notice Dossier Layout */}
        <div className="p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 space-y-6 print:bg-white print:text-black print:p-0 print:border-none">
          {/* Department Official Header */}
          <div className="text-center border-b border-slate-800 pb-4 print:border-black">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 print:text-gray-600">
              Government of India • Department of Consumer Affairs
            </p>
            <h2 className="text-base font-extrabold uppercase mt-1">
              Legal Metrology (Packaged Commodities) Rules, 2011
            </h2>
            <p className="text-xs font-semibold text-blue-400 print:text-black mt-0.5">
              Statutory Label Compliance Audit Notice & Verification Certificate
            </p>
          </div>

          {/* Meta Details Table */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p><span className="text-slate-400 print:text-gray-600">Inspection ID:</span> <span className="font-mono font-bold">{inspection.id}</span></p>
              <p><span className="text-slate-400 print:text-gray-600">Reference:</span> <span className="font-mono">{inspection.referenceId}</span></p>
              <p><span className="text-slate-400 print:text-gray-600">Commodity:</span> <span className="font-bold">{inspection.productName}</span></p>
              <p><span className="text-slate-400 print:text-gray-600">Category:</span> {inspection.category}</p>
            </div>
            <div className="space-y-1 text-right">
              <p><span className="text-slate-400 print:text-gray-600">Inspection Date:</span> {new Date(inspection.createdAt).toLocaleDateString()}</p>
              <p><span className="text-slate-400 print:text-gray-600">Enforcement Officer:</span> {inspection.officer}</p>
              <p><span className="text-slate-400 print:text-gray-600">Overall Status:</span> <span className="font-bold font-mono">{inspection.status}</span></p>
              <p><span className="text-slate-400 print:text-gray-600">AI Confidence:</span> {inspection.confidenceScore}%</p>
            </div>
          </div>

          {/* Violations Summary in Report */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black mb-2 border-b border-slate-800 pb-1">
              1. Statutory Non-Compliance Findings
            </h4>
            {inspection.violations.length === 0 ? (
              <p className="text-xs text-emerald-400 print:text-green-700">No violations observed. Commodity is compliant under Applicable Rule.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {inspection.violations.map((v, i) => (
                  <li key={i} className="p-2.5 rounded bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-300">
                    <div className="flex justify-between font-semibold">
                      <span>• {v.title}</span>
                      <span className="font-mono text-[11px] text-slate-400 print:text-black">{v.rule}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 print:text-gray-700 mt-0.5">{v.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Declarations Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black mb-2 border-b border-slate-800 pb-1">
              2. Mandatory Declarations Audit Summary
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {inspection.declarations.map((d, i) => (
                <div key={i} className="flex justify-between p-1.5 rounded bg-slate-900/60 print:bg-gray-50 border border-slate-800 print:border-gray-200">
                  <span className="text-slate-400 print:text-gray-600">{d.label}:</span>
                  <span className="font-mono font-medium">{d.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Official Signatory Box */}
          <div className="pt-6 border-t border-slate-800 print:border-black flex justify-between items-end text-xs">
            <div>
              <p className="text-[10px] text-slate-400 print:text-gray-600">Generated via SIH26034 Compliance System</p>
              <p className="text-[10px] font-mono text-slate-400">Cryptographic Digest Verified</p>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-slate-600 print:border-black mb-1"></div>
              <p className="font-bold">{inspection.officer || 'Inspector R. Sharma'}</p>
              <p className="text-[10px] text-slate-400 print:text-gray-600">Legal Metrology Inspector</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
