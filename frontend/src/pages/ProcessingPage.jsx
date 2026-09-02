import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  Circle,
  ScanLine,
  Cpu,
  FileCheck2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useInspection } from '../context/InspectionContext';
import Card from '../components/common/Card';

const PROCESSING_STAGES = [
  {
    id: 1,
    title: 'Image received',
    description: 'Validating payload checksum, format, and resolution dimensions',
    duration: 500,
  },
  {
    id: 2,
    title: 'Image quality assessment',
    description: 'Analyzing sharpness, lighting glare, skew angle, and contrast balance',
    duration: 600,
  },
  {
    id: 3,
    title: 'Image preprocessing',
    description: 'Perspective deskewing, noise reduction, and Principal Display Panel isolation',
    duration: 650,
  },
  {
    id: 4,
    title: 'Declaration detection',
    description: 'Locating candidate statutory text blocks and mandatory label bounding boxes',
    duration: 700,
  },
  {
    id: 5,
    title: 'OCR extraction',
    description: 'Optical Character Recognition across localized bounding panels',
    duration: 800,
  },
  {
    id: 6,
    title: 'Declaration extraction',
    description: 'Parsing MRP, Net Quantity, Mfg Date, Packer Address, and Grievance contacts',
    duration: 700,
  },
  {
    id: 7,
    title: 'Legal Metrology validation',
    description: 'Evaluating extracted tokens against Applicable Rule statutory criteria',
    duration: 750,
  },
  {
    id: 8,
    title: 'Compliance assessment',
    description: 'Generating overall compliance verdict and officer audit notice dossier',
    duration: 600,
  },
];

export default function ProcessingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInspection } = useInspection();

  const [inspection, setInspection] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState('');

  // Load inspection record
  useEffect(() => {
    async function load() {
      try {
        const item = await getInspection(id);
        setInspection(item);
      } catch (err) {
        console.error('Error finding inspection', err);
        setError(`Inspection session ${id} not found.`);
      }
    }
    load();
  }, [id, getInspection]);

  // Stage simulation runner
  useEffect(() => {
    if (!inspection || isCompleted) return;

    if (currentStageIndex < PROCESSING_STAGES.length) {
      const stage = PROCESSING_STAGES[currentStageIndex];
      const timer = setTimeout(() => {
        setCompletedStages((prev) => [...prev, stage.id]);
        if (currentStageIndex + 1 < PROCESSING_STAGES.length) {
          setCurrentStageIndex((prev) => prev + 1);
        } else {
          setIsCompleted(true);
        }
      }, stage.duration);

      return () => clearTimeout(timer);
    }
  }, [currentStageIndex, inspection, isCompleted]);

  // Auto-redirect after brief celebration when all stages are complete
  useEffect(() => {
    if (isCompleted) {
      const redirectTimer = setTimeout(() => {
        navigate(`/inspection/${id}/results`);
      }, 1200);
      return () => clearTimeout(redirectTimer);
    }
  }, [isCompleted, id, navigate]);

  const progressPercentage = Math.round(
    ((completedStages.length + (isCompleted ? 0 : 0.5)) / PROCESSING_STAGES.length) * 100
  );

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-center space-y-4">
        <AlertCircle size={36} className="text-rose-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-100">{error}</h3>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <Cpu size={14} className="animate-spin" />
          <span>Automated Compliance Engine Active</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">
          Analyzing Packaged Commodity Sample
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Session ID: {id} • Reference: {inspection?.referenceId || 'REF-LMC'}
        </p>
      </div>

      {/* Target Preview Box */}
      {inspection && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={inspection.imageUrl}
              alt={inspection.productName}
              className="w-14 h-14 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
            />
            <div>
              <h3 className="text-xs font-bold text-slate-100">{inspection.productName}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{inspection.category}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Target Spec</span>
            <p className="text-xs font-semibold text-blue-400">PCR 2011 Standards</p>
          </div>
        </div>
      )}

      {/* Overall Progress Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            {isCompleted ? 'Verification Analysis Complete!' : 'Processing Pipeline Pipeline Stages...'}
          </span>
          <span className="font-mono font-bold text-blue-400 text-sm">
            {isCompleted ? '100%' : `${Math.min(progressPercentage, 98)}%`}
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-gradient-to-r from-blue-500 to-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-gradient-to-r from-blue-600 to-indigo-500'
            }`}
            style={{ width: `${isCompleted ? 100 : Math.min(progressPercentage, 98)}%` }}
          ></div>
        </div>
      </div>

      {/* 8-Stage Execution Stepper */}
      <Card
        title="Simulated Processing Pipeline Stages"
        subtitle="End-to-end automated verification under Legal Metrology Rules"
        icon={ScanLine}
      >
        <div className="space-y-3">
          {PROCESSING_STAGES.map((stage, index) => {
            const isDone = completedStages.includes(stage.id);
            const isCurrent = currentStageIndex === index && !isCompleted;
            const isPending = !isDone && !isCurrent;

            return (
              <div
                key={stage.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                    : isCurrent
                    ? 'bg-blue-950/40 border-blue-500/50 text-slate-100 ring-2 ring-blue-500/20 shadow-lg'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 size={18} className="text-blue-400 animate-spin" />
                    ) : (
                      <Circle size={18} className="text-slate-700" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-400">
                        {String(stage.id).padStart(2, '0')}.
                      </span>
                      <h4
                        className={`text-xs font-bold ${
                          isDone
                            ? 'text-emerald-300'
                            : isCurrent
                            ? 'text-blue-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {stage.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isDone && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      PASSED
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                      PROCESSING
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[10px] font-mono text-slate-400">QUEUED</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bottom Action when done */}
      {isCompleted && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 text-emerald-300">
            <ShieldCheck size={24} className="text-emerald-400" />
            <div>
              <h4 className="text-xs font-bold">Analysis Complete!</h4>
              <p className="text-[11px] text-emerald-400/90">Redirecting to full compliance dossier...</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/inspection/${id}/results`)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <span>View Results Dossier</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
