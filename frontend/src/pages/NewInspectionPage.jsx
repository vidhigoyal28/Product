import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine,
  Package,
  Hash,
  Tag,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import ImageUploader from '../components/inspection/ImageUploader';
import { useInspection } from '../context/InspectionContext';
import Card from '../components/common/Card';

const CATEGORIES = [
  'Food & Confectionery',
  'Cosmetics & Personal Care',
  'Electronics & Hardware',
  'Pharmaceuticals & OTC',
  'Household & Detergents',
  'Beverages & Liquids',
  'Apparel & Textiles',
  'General Merchandise',
];

export default function NewInspectionPage() {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Food & Confectionery');
  const [referenceId, setReferenceId] = useState('');
  const [image, setImage] = useState(null);
  const [simulatedOutcome, setSimulatedOutcome] = useState('COMPLIANT');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createInspection } = useInspection();
  const navigate = useNavigate();

  // Auto-generate reference ID on load
  useEffect(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    setReferenceId(`REF-LMC-${dateStr}-${randomNum}`);
  }, []);

  const handlePresetSelect = (preset) => {
    setProductName(preset.name.replace(/ \(.*\)/, ''));
    setCategory(preset.category);
    if (preset.tag === 'Sample 1') setSimulatedOutcome('COMPLIANT');
    if (preset.tag === 'Sample 2') setSimulatedOutcome('NON_COMPLIANT');
    if (preset.tag === 'Sample 3') setSimulatedOutcome('NEEDS_REVIEW');
    setError('');
  };

  const handleStartAnalysis = async (e) => {
    e.preventDefault();
    setError('');

    if (!image) {
      setError('Please upload or capture a package label image before starting analysis.');
      return;
    }

    if (!productName.trim()) {
      setError('Please enter the commodity/product name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createInspection({
        productName: productName.trim(),
        category,
        referenceId: referenceId.trim(),
        imageUrl: image.previewUrl,
        forceStatus: simulatedOutcome,
      });

      // Route to Processing Simulator page
      navigate(`/inspection/${created.id}`);
    } catch (err) {
      console.error('Failed to initiate inspection', err);
      setError('Failed to initiate inspection session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">New Package Inspection</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              Step 1 of 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Capture or upload packaged commodity principal display panel (PDP) for statutory verification
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileCheck2 size={16} className="text-emerald-400" />
          <span>PCR 2011 Automated Audit</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleStartAnalysis} className="space-y-6">
        {/* Section 1: Image Upload & Capture */}
        <Card
          title="1. Package Label Image Capture / Upload"
          subtitle="Clear, unobstructed image of the package's Principal Display Panel"
          icon={ScanLine}
        >
          <ImageUploader
            image={image}
            onImageChange={setImage}
            onPresetSelect={handlePresetSelect}
          />
        </Card>

        {/* Section 2: Commodity Metadata */}
        <Card
          title="2. Commodity Information & Inspection Reference"
          subtitle="Identifier and product categorization details"
          icon={Package}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Product / Commodity Trade Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Package size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. NutriDelight Almond Butter Cookies 200g"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-slate-100 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Product Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Commodity Category <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-slate-100 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inspection Reference ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Inspection Reference ID <span className="text-slate-500">(Auto-generated / Editable)</span>
              </label>
              <div className="relative">
                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="REF-LMC-..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-slate-100 text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Simulation Mode Toggle (For Phase 1 Demo & Testing) */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-400" />
            <div>
              <span className="font-semibold text-slate-200">Phase 1 Mock Simulation Test Mode</span>
              <p className="text-[11px] text-slate-400">Select simulated AI evaluation outcome for this sample</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'COMPLIANT', label: 'Compliant', color: 'text-emerald-400 border-emerald-500/30' },
              { id: 'NON_COMPLIANT', label: 'Non-Compliant', color: 'text-rose-400 border-rose-500/30' },
              { id: 'NEEDS_REVIEW', label: 'Needs Review', color: 'text-amber-400 border-amber-500/30' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSimulatedOutcome(opt.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  simulatedOutcome === opt.id
                    ? `bg-slate-800 ring-2 ring-blue-500 ${opt.color}`
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Initiating Engine...</span>
            ) : (
              <>
                <ScanLine size={16} />
                <span>Start Analysis</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
