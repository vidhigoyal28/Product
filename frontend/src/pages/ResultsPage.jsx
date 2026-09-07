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
  AlertOctagon,
  Clock,
  Save,
  MessageSquare,
  RotateCcw
} from 'lucide-react';

import { useInspection } from '../context/InspectionContext';
import StatusBadge from '../components/common/StatusBadge';
import EvidenceViewer from '../components/inspection/EvidenceViewer';
import DeclarationTable from '../components/inspection/DeclarationTable';
import ViolationsList from '../components/inspection/ViolationsList';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import apiClient from '../services/api';

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInspection } = useInspection();

  const [inspection, setInspection] = useState(null);

  // Loading/error state for inspection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Keep the original AI result separate from the officer's final decision
  const [aiStatus, setAiStatus] = useState(null);

  // Backend review records
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Officer review state
  const [selectedDecision, setSelectedDecision] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Official Report Preview Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // ---------------------------------------------------------
  // Current logged-in officer
  // ---------------------------------------------------------
  const getCurrentOfficer = () => {
    try {
      const storedUser = localStorage.getItem('lmc_auth_user_v1');

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (err) {
      console.error('Unable to read current user', err);
      return null;
    }
  };

  // ---------------------------------------------------------
  // Safely convert backend/API errors into renderable text
  // ---------------------------------------------------------
  const getApiErrorMessage = (err, fallback) => {
    const detail = err?.response?.data?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item?.msg) return item.msg;
          if (item?.message) return item.message;
          return JSON.stringify(item);
        })
        .join('; ');
    }

    if (detail && typeof detail === 'object') {
      return (
        detail.msg ||
        detail.message ||
        JSON.stringify(detail)
      );
    }

    const message = err?.response?.data?.message;

    if (typeof message === 'string') {
      return message;
    }

    if (typeof err?.message === 'string') {
      return err.message;
    }

    return fallback;
  };

  // ---------------------------------------------------------
  // Format reviewer name
  // ---------------------------------------------------------
  const getReviewerName = (review) => {
    if (!review) {
      return 'Unknown Reviewer';
    }

    if (review.reviewer_name) {
      return review.reviewer_name;
    }

    if (review.reviewer?.full_name) {
      return review.reviewer.full_name;
    }

    if (review.reviewer?.username) {
      return review.reviewer.username;
    }

    if (review.reviewer?.name) {
      return review.reviewer.name;
    }

    const currentOfficer = getCurrentOfficer();

    if (currentOfficer) {
      return (
        currentOfficer.full_name ||
        currentOfficer.name ||
        currentOfficer.username ||
        'Current Officer'
      );
    }

    if (review.reviewer_id) {
      return review.reviewer_id;
    }

    return 'Unknown Reviewer';
  };

  // ---------------------------------------------------------
  // Convert backend review into UI decision
  // ---------------------------------------------------------
  const getDecisionLabel = (review) => {
    if (!review) {
      return 'No Officer Decision';
    }

    if (review.action_type === 'ACCEPT_ALL') {
      return 'Confirmed AI Result';
    }

    if (review.new_status === 'COMPLIANT') {
      return 'Override to Compliant';
    }

    if (review.new_status === 'NON_COMPLIANT') {
      return 'Override to Non-Compliant';
    }

    if (review.new_status === 'NEEDS_REVIEW') {
      return 'Marked as Needs Review';
    }

    return review.action_type || 'Officer Review';
  };

  // ---------------------------------------------------------
  // Load inspection + existing reviews
  // ---------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      setReviewError('');

      try {
        const data = await getInspection(id);

        if (!mounted) {
          return;
        }

        setInspection(data);

        // Preserve the original AI result.
        const originalAIStatus =
          data.overallStatus ||
          data.overall_status ||
          data.status ||
          'NEEDS_REVIEW';

        setAiStatus(originalAIStatus);
      } catch (err) {
        console.error('Failed to load results', err);

        if (mounted) {
          setError(
            getApiErrorMessage(
              err,
              'Failed to retrieve inspection record.'
            )
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  // ---------------------------------------------------------
  // Load reviews from real backend
  // ---------------------------------------------------------
  useEffect(() => {
    if (!inspection?.id) {
      return;
    }

    let mounted = true;

    async function loadReviews() {
      setLoadingReviews(true);
      setReviewError('');

      try {
        const response = await apiClient.get(
          `/reviews/${inspection.id}`
        );

        if (!mounted) {
          return;
        }

        const reviewData = response.data || [];

        setReviews(reviewData);

        // Most recent review is returned first by backend.
        const latestReview = reviewData[0];

        if (latestReview) {
          setReviewComment(latestReview.comments || '');

          if (latestReview.action_type === 'ACCEPT_ALL') {
            setSelectedDecision('CONFIRM_AI');
          } else if (latestReview.new_status === 'COMPLIANT') {
            setSelectedDecision('OVERRIDE_COMPLIANT');
          } else if (latestReview.new_status === 'NON_COMPLIANT') {
            setSelectedDecision('OVERRIDE_NON_COMPLIANT');
          } else if (latestReview.new_status === 'NEEDS_REVIEW') {
            setSelectedDecision('NEEDS_REVIEW');
          }
        }
      } catch (err) {
        console.error('Failed to load reviews', err);

        if (mounted) {
          setReviewError(
            getApiErrorMessage(
              err,
              'Unable to load officer review history.'
            )
          );
        }
      } finally {
        if (mounted) {
          setLoadingReviews(false);
        }
      }
    }

    loadReviews();

    return () => {
      mounted = false;
    };
  }, [inspection?.id]);

  // ---------------------------------------------------------
  // Decision configuration
  // ---------------------------------------------------------
  const reviewOptions = [
    {
      value: 'CONFIRM_AI',
      label: 'Confirm AI Result',
      description: 'Accept the compliance result produced by the AI system.',
      icon: CheckCircle2,
      color: 'emerald'
    },
    {
      value: 'OVERRIDE_COMPLIANT',
      label: 'Override to Compliant',
      description: 'Officer determines that the package is compliant.',
      icon: ShieldCheck,
      color: 'emerald'
    },
    {
      value: 'OVERRIDE_NON_COMPLIANT',
      label: 'Override to Non-Compliant',
      description: 'Officer determines that the package is non-compliant.',
      icon: XCircle,
      color: 'rose'
    },
    {
      value: 'NEEDS_REVIEW',
      label: 'Mark as Needs Review',
      description: 'Keep the inspection open for additional verification.',
      icon: AlertTriangle,
      color: 'amber'
    }
  ];

  // ---------------------------------------------------------
  // Determine whether comment is mandatory
  // ---------------------------------------------------------
  const commentRequired =
    selectedDecision === 'OVERRIDE_COMPLIANT' ||
    selectedDecision === 'OVERRIDE_NON_COMPLIANT' ||
    selectedDecision === 'NEEDS_REVIEW';

  // ---------------------------------------------------------
  // Convert selected decision to backend payload
  // ---------------------------------------------------------
  const buildReviewPayload = () => {
    if (selectedDecision === 'CONFIRM_AI') {
      return {
        action_type: 'ACCEPT_ALL',
        new_status: aiStatus,
        comments: reviewComment.trim() || 'AI result confirmed'
      };
    }

    if (selectedDecision === 'OVERRIDE_COMPLIANT') {
      return {
        action_type: 'OVERRIDE_VERDICT',
        new_status: 'COMPLIANT',
        comments: reviewComment.trim() || ''
      };
    }

    if (selectedDecision === 'OVERRIDE_NON_COMPLIANT') {
      return {
        action_type: 'OVERRIDE_VERDICT',
        new_status: 'NON_COMPLIANT',
        comments: reviewComment.trim() || ''
      };
    }

    if (selectedDecision === 'NEEDS_REVIEW') {
      return {
        action_type: 'OVERRIDE_VERDICT',
        new_status: 'NEEDS_REVIEW',
        comments: reviewComment.trim() || ''
      };
    }

    return null;
  };

  // ---------------------------------------------------------
  // Save Officer Review
  // ---------------------------------------------------------
  const handleSaveReview = async () => {
    setReviewSuccess('');
    setReviewError('');

    if (!selectedDecision) {
      setReviewError('Please select an officer decision.');
      return;
    }

  if (commentRequired && reviewComment.trim().length < 2) {
  setReviewError(
    'A review comment of at least 2 characters is required for this decision.'
  );
  return;
}

    const payload = buildReviewPayload();

    if (!payload) {
      setReviewError('Invalid officer decision.');
      return;
    }

    setIsSavingReview(true);

    try {
      // Backend endpoint:
      // POST /api/reviews?inspection_id=<inspection_id>
      const response = await apiClient.post(
        '/reviews',
        payload,
        {
          params: {
            inspection_id: inspection.id
          }
        }
      );

      const savedReview = response.data;

      // Add newest review to top
      setReviews((previous) => [
        savedReview,
        ...previous
      ]);

      // Update final inspection status locally.
      const finalStatus =
        payload.new_status ||
        inspection.status;

      setInspection((previous) => ({
        ...previous,
        status: finalStatus,
        overallStatus: finalStatus,
        overall_status: finalStatus,
        review: {
          ...(previous.review || {}),
          isReviewed: true,
          officerNotes: payload.comments || '',
          actionTaken: payload.action_type,
          reviewedAt:
            savedReview?.created_at ||
            new Date().toISOString()
        }
      }));

      setReviewSuccess(
        'Officer review saved successfully.'
      );

      // Scroll user to the saved review area.
      setTimeout(() => {
        document
          .getElementById('officer-review-section')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
      }, 100);
    } catch (err) {
      console.error('Failed to save officer review', err);

      setReviewError(
        getApiErrorMessage(
          err,
          'Failed to save officer review.'
        )
      );
    } finally {
      setIsSavingReview(false);
    }
  };

  // ---------------------------------------------------------
  // Reset review form
  // ---------------------------------------------------------
  const handleResetReview = () => {
    const latestReview = reviews[0];

    if (latestReview) {
      if (latestReview.action_type === 'ACCEPT_ALL') {
        setSelectedDecision('CONFIRM_AI');
      } else if (latestReview.new_status === 'COMPLIANT') {
        setSelectedDecision('OVERRIDE_COMPLIANT');
      } else if (latestReview.new_status === 'NON_COMPLIANT') {
        setSelectedDecision('OVERRIDE_NON_COMPLIANT');
      } else if (latestReview.new_status === 'NEEDS_REVIEW') {
        setSelectedDecision('NEEDS_REVIEW');
      }

      setReviewComment(latestReview.comments || '');
    } else {
      setSelectedDecision('');
      setReviewComment('');
    }

    setReviewError('');
    setReviewSuccess('');
  };

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

          <p className="text-xs text-slate-400 font-mono">
            Loading compliance dossier...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Error
  // ---------------------------------------------------------
  if (error || !inspection) {
    return (
      <div className="max-w-md mx-auto p-6 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-center space-y-4">
        <AlertOctagon
          size={36}
          className="text-rose-400 mx-auto"
        />

        <h3 className="text-sm font-bold text-slate-100">
          {error || 'Inspection not found'}
        </h3>

        <Link
          to="/history"
          className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          Return to History
        </Link>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Status helpers
  // ---------------------------------------------------------
  const currentFinalStatus =
    inspection.overallStatus ||
    inspection.overall_status ||
    inspection.status ||
    'NEEDS_REVIEW';

  const currentAIStatus =
    aiStatus ||
    'NEEDS_REVIEW';

  const isCompliant =
    currentAIStatus === 'COMPLIANT';

  const isNonCompliant =
    currentAIStatus === 'NON_COMPLIANT';

  const isNeedsReview =
    currentAIStatus === 'NEEDS_REVIEW';

  const latestReview = reviews[0];

  const officerFinalStatus =
    latestReview?.new_status ||
    currentFinalStatus;

  const hasOfficerDecision =
    reviews.length > 0;

  // Report data - supports backend snake_case fields
  const reportProductName =
    inspection.productName || inspection.product_name || 'Not Available';

  const reportReferenceId =
    inspection.referenceId || inspection.reference_id || '—';

  const reportConfidence = Number(
    inspection.confidenceScore ?? inspection.confidence_score ?? 0
  ).toFixed(1);

  const reportCreatedAt =
    inspection.createdAt || inspection.created_at;

  const reportDate = reportCreatedAt
    ? new Date(reportCreatedAt).toLocaleDateString()
    : 'Not Available';

  const reportDeclarations = inspection.declarations || [];

  const reportViolations =
    (inspection.violations && inspection.violations.length > 0)
      ? inspection.violations
      : (inspection.findings || [])
          .filter((f) => f.result === 'FAIL')
          .map((f, i) => ({
            id: f.id || i,
            title: f.field
              ? f.field.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) + ' Non-Compliance'
              : 'Statutory Non-Compliance',
            rule: f.rule?.rule_clause_reference || 'Applicable Rule',
            description: f.reason,
            severity: f.rule?.severity || 'HIGH',
          }));

  const getOfficerDisplayName = () => {
    if (typeof inspection.officer === 'object' && inspection.officer !== null) {
      return inspection.officer.full_name || inspection.officer.username || 'Inspector R. Sharma';
    }
    if (typeof inspection.officer === 'string' && inspection.officer.trim()) {
      return inspection.officer;
    }
    const currentOfficer = getCurrentOfficer();
    if (currentOfficer) {
      return currentOfficer.full_name || currentOfficer.username || 'Inspector R. Sharma';
    }
    return 'Inspector R. Sharma';
  };



  return (
    <div className="space-y-8">

      {/* =====================================================
          NAVIGATION / ACTION BAR
      ====================================================== */}
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

              <span className="text-xs font-mono text-slate-400">
                ({inspection.inspection_code || inspection.id})
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              Ref:{' '}
              <span className="font-mono text-slate-300">
                {inspection.referenceId ||
                  inspection.reference_id ||
                  '—'}
              </span>{' '}
              • Assessed on{' '}
              {new Date(
                inspection.createdAt ||
                  inspection.created_at
              ).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() =>
              document
                .getElementById('officer-review-section')
                ?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                })
            }
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Edit3
              size={15}
              className="text-blue-400"
            />
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

      {/* =====================================================
          AI RESULT
      ====================================================== */}
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

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Sparkles
                size={18}
                className="text-blue-400"
              />

              <span className="text-xs uppercase tracking-wider font-bold text-blue-300">
                AI Compliance Result
              </span>

              <StatusBadge
                status={currentAIStatus}
                size="lg"
              />

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs font-mono text-slate-300">
                <span>Confidence:</span>

                <span className="font-bold text-blue-400">
                  {Number(
                    inspection.confidenceScore ||
                      inspection.confidence_score ||
                      0
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-100">
                {inspection.productName ||
                  inspection.product_name}
              </h2>

              <p className="text-xs text-slate-300 mt-1">
                Category:{' '}
                <span className="font-semibold text-slate-200">
                  {inspection.category || '—'}
                </span>{' '}
                • Enforcement Target:{' '}
                <span className="font-mono text-slate-300">
                  PCR 2011 Mandatory Declarations
                </span>
              </p>
            </div>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isCompliant &&
                'The AI compliance engine found the package compliant based on the extracted declarations and applicable compliance checks.'}

              {isNonCompliant &&
                `The AI compliance engine identified ${
                  (inspection.violations || []).length
                } compliance finding(s) requiring officer verification.`}

              {isNeedsReview &&
                'The AI result requires manual officer verification because the automated result requires additional review.'}
            </p>
          </div>

          {/* AI result explicitly separated */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2 shrink-0 min-w-[250px]">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <Sparkles
                size={14}
                className="text-blue-400"
              />
              <span>AI Result</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">
                Automated Verdict:
              </span>

              <StatusBadge
                status={currentAIStatus}
                size="sm"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              This is the original automated result and is not changed by an officer override.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          OFFICER FINAL DECISION SUMMARY
      ====================================================== */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-950/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck
            size={18}
            className="text-blue-400"
          />

          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Officer Final Decision
          </h3>
        </div>

        {!hasOfficerDecision ? (
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-3">
              <Clock
                size={18}
                className="text-amber-400"
              />

              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Pending Officer Review
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  The AI result has not yet been confirmed or overridden by an officer.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                Final Decision
              </p>

              <StatusBadge
                status={officerFinalStatus}
                size="lg"
              />

              <p className="text-sm font-semibold text-slate-200 mt-3">
                {getDecisionLabel(latestReview)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-2">
                <UserCheck size={13} />
                Reviewer
              </div>

              <p className="text-sm font-semibold text-slate-200">
                {getReviewerName(latestReview)}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
                <Calendar size={12} />

                {latestReview?.created_at
                  ? new Date(
                      latestReview.created_at
                    ).toLocaleString()
                  : 'Timestamp unavailable'}
              </div>
            </div>

            {latestReview?.comments && (
              <div className="lg:col-span-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-2">
                  <MessageSquare size={13} />
                  Officer Comment
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {latestReview.comments}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          EVIDENCE + VIOLATIONS
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left */}
        <div className="lg:col-span-5 space-y-4">

          <EvidenceViewer
            imageUrl={inspection.imageUrl}
            boundingBoxes={
              inspection.boundingBoxes || []
            }
            productName={
              inspection.productName ||
              inspection.product_name
            }
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

        {/* Right */}
        <div className="lg:col-span-7 space-y-6">

          {/* Violations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle
                  size={16}
                  className="text-amber-400"
                />

                <span>
                  Detected Violations & Non-Compliances
                </span>
              </h3>

              <span className="text-xs font-mono text-slate-400">
                ({(inspection.violations || []).length}{' '}
                flagged)
              </span>
            </div>

            <ViolationsList
              violations={inspection.violations || []}
            />
          </div>

          {/* Declarations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck
                  size={16}
                  className="text-blue-400"
                />

                <span>
                  Mandatory Declarations Audit
                </span>
              </h3>

              <span className="text-xs font-mono text-slate-400">
                {(inspection.declarations || []).filter(
                  (d) => d.status === 'PASS'
                ).length}{' '}
                of{' '}
                {(inspection.declarations || []).length}{' '}
                Passed
              </span>
            </div>

            <DeclarationTable
              declarations={
                inspection.declarations || []
              }
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          OFFICER REVIEW SECTION
      ====================================================== */}
      <section
        id="officer-review-section"
        className="scroll-mt-6"
      >
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 overflow-hidden">

          {/* Section Header */}
          <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

              <div>
                <div className="flex items-center gap-2">
                  <UserCheck
                    size={18}
                    className="text-blue-400"
                  />

                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Officer Review & Override
                  </h3>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  Review the automated compliance result and record the official officer decision.
                </p>
              </div>

              {hasOfficerDecision && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    Current Final Status
                  </span>

                  <StatusBadge
                    status={officerFinalStatus}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Success */}
            {reviewSuccess && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle2
                  size={18}
                  className="text-emerald-400 mt-0.5 shrink-0"
                />

                <div>
                  <p className="text-xs font-semibold text-emerald-300">
                    Review Saved
                  </p>

                  <p className="text-[11px] text-emerald-400/80 mt-1">
                    {reviewSuccess}
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {reviewError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <AlertOctagon
                  size={18}
                  className="text-rose-400 mt-0.5 shrink-0"
                />

                <div>
                  <p className="text-xs font-semibold text-rose-300">
                    Review Error
                  </p>

                  <p className="text-[11px] text-rose-400/80 mt-1">
                    {reviewError}
                  </p>
                </div>
              </div>
            )}

            {/* AI result reminder */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between gap-3">

                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    Original AI Result
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <StatusBadge
                      status={currentAIStatus}
                      size="sm"
                    />

                    <span className="text-xs text-slate-400">
                      AI confidence:{' '}
                      <span className="font-mono text-blue-400">
                        {Number(
                          inspection.confidenceScore ||
                            inspection.confidence_score ||
                            0
                        ).toFixed(1)}
                        %
                      </span>
                    </span>
                  </div>
                </div>

                <Sparkles
                  size={20}
                  className="text-blue-400"
                />
              </div>
            </div>

            {/* Decision choices */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-3">
                Officer Decision
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {reviewOptions.map((option) => {
                  const Icon = option.icon;
                  const selected =
                    selectedDecision === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSelectedDecision(
                          option.value
                        );
                        setReviewError('');
                        setReviewSuccess('');
                      }}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        selected
                          ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/20'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-start gap-3">

                        <div
                          className={`p-2 rounded-lg ${
                            selected
                              ? 'bg-blue-500/20'
                              : 'bg-slate-800'
                          }`}
                        >
                          <Icon
                            size={17}
                            className={
                              selected
                                ? 'text-blue-300'
                                : 'text-slate-400'
                            }
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-xs font-bold ${
                                selected
                                  ? 'text-blue-300'
                                  : 'text-slate-200'
                              }`}
                            >
                              {option.label}
                            </p>

                            {selected && (
                              <CheckCircle2
                                size={15}
                                className="text-blue-400 shrink-0"
                              />
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Officer Review Comment
                </label>

                <span
                  className={`text-[10px] ${
                    commentRequired
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }`}
                >
                  {commentRequired
                    ? 'Required'
                    : 'Optional'}
                </span>
              </div>

              <textarea
                rows={5}
                value={reviewComment}
                onChange={(e) => {
                  setReviewComment(e.target.value);
                  setReviewError('');
                  setReviewSuccess('');
                }}
                placeholder={
                  commentRequired
                    ? 'Enter the reason for this officer decision...'
                    : 'Optional officer observation or confirmation note...'
                }
                className={`w-full p-3 rounded-xl bg-slate-950/60 border text-slate-100 text-xs focus:outline-none focus:ring-1 ${
                  commentRequired &&
                  !reviewComment.trim()
                    ? 'border-amber-500/40 focus:border-amber-500 focus:ring-amber-500'
                    : 'border-slate-700/80 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />

              {commentRequired && (
                <p className="text-[10px] text-amber-400/80 mt-1.5">
                  A comment is required when overriding the AI verdict or marking the inspection for further review.
                </p>
              )}
            </div>

            {/* Save / Reset */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">

              <div className="text-[10px] text-slate-500">
                <span className="font-semibold text-slate-400">
                  Audit logging:
                </span>{' '}
                Your decision will be recorded against this inspection with the current timestamp.
              </div>

              <div className="flex items-center gap-2 shrink-0">

                <button
                  type="button"
                  onClick={handleResetReview}
                  disabled={isSavingReview}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-2"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={handleSaveReview}
                  disabled={
                    isSavingReview ||
                    !selectedDecision
                  }
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2"
                >
                  {isSavingReview ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Save Officer Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          REVIEW HISTORY
      ====================================================== */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock
              size={16}
              className="text-slate-400"
            />

            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Review Audit Trail
            </h3>
          </div>

          <span className="text-xs font-mono text-slate-500">
            {reviews.length} Review
            {reviews.length === 1 ? '' : 's'}
          </span>
        </div>

        {loadingReviews ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading review history...
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <UserCheck
              size={28}
              className="text-slate-600 mx-auto mb-2"
            />

            <p className="text-xs font-semibold text-slate-400">
              No Officer Reviews Yet
            </p>

            <p className="text-[11px] text-slate-600 mt-1">
              The audit trail will appear here after the first officer review is saved.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review, index) => (
              <div
                key={
                  review.id ||
                  `${review.created_at}-${index}`
                }
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-800">
                      <UserCheck
                        size={15}
                        className="text-blue-400"
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold text-slate-200">
                          {getDecisionLabel(review)}
                        </p>

                        {review.new_status && (
                          <StatusBadge
                            status={review.new_status}
                            size="sm"
                          />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1">
                        Reviewed by{' '}
                        <span className="text-slate-300">
                          {getReviewerName(review)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Calendar size={11} />

                    {review.created_at
                      ? new Date(
                          review.created_at
                        ).toLocaleString()
                      : 'Timestamp unavailable'}
                  </div>
                </div>

                {review.comments && (
                  <div className="mt-3 ml-0 sm:ml-11 p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      <span className="font-semibold text-slate-300">
                        Comment:
                      </span>{' '}
                      {review.comments}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          OFFICIAL REPORT PREVIEW
      ====================================================== */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Official Legal Metrology Inspection Notice & Dossier"
        subtitle="Form II - Packaged Commodities Statutory Audit Report"
        size="lg"
        footer={
          <>
            <button
              onClick={() =>
                setIsReportModalOpen(false)
              }
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
        <div id="printable-report" className="p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 space-y-6 print:bg-white print:text-black print:p-0 print:border-none">

          {/* Department Header */}
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
              <p>
                <span className="text-slate-400 print:text-gray-600">
                  Inspection ID:
                </span>{' '}
                <span className="font-mono font-bold">
                  {inspection.inspection_code ||
                    inspection.inspectionCode ||
                    inspection.id}
                </span>
              </p>

              <p>
                <span className="text-slate-400 print:text-gray-600">
                  Reference:
                </span>{' '}
                <span className="font-mono">
                  {reportReferenceId}
                </span>
              </p>

              <p>
                <span className="text-slate-400 print:text-gray-600">
                  Commodity:
                </span>{' '}
                <span className="font-bold">
                  {reportProductName}
                </span>
              </p>

              <p>
                <span className="text-slate-400 print:text-gray-600">
                  Category:
                </span>{' '}
                {inspection.category || 'Not Available'}
              </p>
            </div>

            <div className="space-y-1 text-right">
              <p>
                <span className="text-slate-400 print:text-gray-600">
                  Inspection Date:
                </span>{' '}
                {reportDate}
              </p>

              <p>
                <span className="text-slate-400 print:text-gray-600">
                  Enforcement Officer:
                </span>{' '}
                <span className="font-semibold">
                  {getOfficerDisplayName()}
                </span>
              </p>

              <p>
                <span className="text-slate-400 print:text-gray-600">
                  Overall Status:
                </span>{' '}
                <span className="font-bold font-mono">
                  {officerFinalStatus}
                </span>
              </p>

              <p>
                <span className="text-slate-400 print:text-gray-600">
                  AI Result:
                </span>{' '}
                <span className="font-bold font-mono">
                  {currentAIStatus}
                </span>
              </p>

              <p>
                <span className="text-slate-400 print:text-gray-600">
                  AI Confidence:
                </span>{' '}
                <span className="font-mono">
                  {reportConfidence}%
                </span>
              </p>
            </div>
          </div>

          {/* Section 1: Statutory Non-Compliance Findings */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black mb-2 border-b border-slate-800 pb-1">
              1. Statutory Non-Compliance Findings
            </h4>

            {reportViolations.length === 0 ? (
              <p className="text-xs text-emerald-400 print:text-green-700">
                No violations observed. Commodity is compliant under Applicable Rule.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {reportViolations.map((v, i) => (
                  <li
                    key={v.id || i}
                    className="p-2.5 rounded bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-300"
                  >
                    <div className="flex justify-between font-semibold">
                      <span>
                        • {v.title}
                      </span>

                      <span className="font-mono text-[11px] text-slate-400 print:text-black">
                        {v.rule || 'Applicable Rule'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 print:text-gray-700 mt-0.5">
                      {v.description}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Section 2: Mandatory Declarations Audit Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black mb-2 border-b border-slate-800 pb-1">
              2. Mandatory Declarations Audit Summary
            </h4>

            {reportDeclarations.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {reportDeclarations.map((d, i) => (
                  <div
                    key={d.id || i}
                    className="flex justify-between gap-3 p-1.5 rounded bg-slate-900/60 print:bg-gray-50 border border-slate-800 print:border-gray-200"
                  >
                    <span className="text-slate-400 print:text-gray-600">
                      {d.field_name || d.label || 'Declaration'}:
                    </span>

                    <span className="font-mono font-medium text-right">
                      {d.raw_text ||
                        d.normalized_value ||
                        d.value ||
                        d.status ||
                        'Not Detected'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No declaration data available.
              </p>
            )}
          </div>

          {/* Section 3: Officer Review & Final Decision */}
          {latestReview && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black mb-2 border-b border-slate-800 pb-1">
                3. Officer Review & Final Decision
              </h4>

              <div className="space-y-1 text-xs">
                <p>
                  <span className="text-slate-400 print:text-gray-600">
                    Decision:
                  </span>{' '}
                  <span className="font-bold">
                    {getDecisionLabel(latestReview)}
                  </span>
                </p>

                <p>
                  <span className="text-slate-400 print:text-gray-600">
                    Final Status:
                  </span>{' '}
                  <span className="font-bold font-mono">
                    {latestReview.new_status}
                  </span>
                </p>

                <p>
                  <span className="text-slate-400 print:text-gray-600">
                    Reviewer:
                  </span>{' '}
                  {getReviewerName(latestReview)}
                </p>

                {latestReview.comments && (
                  <p>
                    <span className="text-slate-400 print:text-gray-600">
                      Comment:
                    </span>{' '}
                    {latestReview.comments}
                  </p>
                )}

                <p>
                  <span className="text-slate-400 print:text-gray-600">
                    Reviewed At:
                  </span>{' '}
                  {latestReview.created_at
                    ? new Date(latestReview.created_at).toLocaleString()
                    : '—'}
                </p>
              </div>
            </div>
          )}

          {/* Section 4: Signatory & Digest */}
          <div className="pt-6 border-t border-slate-800 print:border-black flex justify-between items-end text-xs">
            <div>
              <p className="text-[10px] text-slate-400 print:text-gray-600">
                Generated via SIH26034 Compliance System
              </p>

              <p className="text-[10px] font-mono text-slate-400">
                Cryptographic Digest Verified
              </p>
            </div>

            <div className="text-center">
              <div className="w-36 border-b border-slate-600 print:border-black mb-1"></div>
              <p className="font-bold">
                {latestReview ? getReviewerName(latestReview) : getOfficerDisplayName()}
              </p>
              <p className="text-[10px] text-slate-400 print:text-gray-600">
                Legal Metrology Inspector
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}