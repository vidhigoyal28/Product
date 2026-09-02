import React, { useState } from 'react';
import { Maximize2, ZoomIn, ZoomOut, Layers, Eye, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';

export default function EvidenceViewer({
  imageUrl,
  boundingBoxes = [],
  productName,
  className = ''
}) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);
  const [activeBox, setActiveBox] = useState(null);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden flex flex-col ${className}`}>
      {/* Viewer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-blue-400" />
          <span className="text-xs font-semibold text-slate-200">Evidence & Visual Inspection Panel</span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              showBoxes
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle Bounding Boxes"
          >
            <Layers size={13} />
            <span>Overlays: {showBoxes ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700"
            title="Reset Zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>

          <button
            type="button"
            onClick={() => setIsFullModalOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Full Screen Inspection"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Main Image Canvas Container */}
      <div className="relative flex-1 min-h-[380px] bg-slate-950 flex items-center justify-center p-4 overflow-hidden select-none">
        <div
          className="relative inline-block transition-transform duration-150 max-w-full max-h-[480px]"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          <img
            src={imageUrl || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop&q=80'}
            alt={productName || 'Package Evidence'}
            className="max-h-[420px] w-auto object-contain rounded-lg border border-slate-800 shadow-2xl"
          />

          {/* Bounding Box Overlays (Phase 1 Simulated Visual Markers) */}
          {showBoxes && boundingBoxes.map((box) => {
            const isPass = box.status === 'PASS';
            const isFail = box.status === 'FAIL';
            const isReview = box.status === 'NEEDS_REVIEW';

            const borderColor = isFail
              ? 'border-rose-500 bg-rose-500/15 text-rose-300'
              : isReview
              ? 'border-amber-500 bg-amber-500/15 text-amber-300'
              : 'border-emerald-500 bg-emerald-500/10 text-emerald-300';

            const tagColor = isFail
              ? 'bg-rose-600 text-white'
              : isReview
              ? 'bg-amber-600 text-white'
              : 'bg-emerald-600 text-white';

            return (
              <div
                key={box.id}
                onMouseEnter={() => setActiveBox(box)}
                onMouseLeave={() => setActiveBox(null)}
                className={`absolute border-2 rounded transition-all cursor-pointer ${borderColor} ${
                  activeBox?.id === box.id ? 'ring-4 ring-blue-400/40 z-20 scale-105' : 'z-10'
                }`}
                style={{
                  top: `${box.y}%`,
                  left: `${box.x}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                }}
              >
                <span
                  className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow ${tagColor}`}
                >
                  {box.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hover Box Info Overlay */}
        {activeBox && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-700/90 rounded-xl p-3 backdrop-blur-md shadow-xl flex items-center justify-between z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-3">
              {activeBox.status === 'PASS' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
              {activeBox.status === 'FAIL' && <ShieldAlert size={18} className="text-rose-400 shrink-0" />}
              {activeBox.status === 'NEEDS_REVIEW' && <AlertTriangle size={18} className="text-amber-400 shrink-0" />}
              <div>
                <p className="text-xs font-semibold text-slate-100">{activeBox.label}</p>
                <p className="text-[11px] text-slate-400">Status: {activeBox.status || 'PASS'} | OCR Detection Region #{activeBox.id}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              PDP Region
            </span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <span className="text-[11px]">
          {boundingBoxes.length > 0
            ? `${boundingBoxes.length} Statutory Declaration Regions Highlighted`
            : 'Evidence Label Visualizer'}
        </span>
        <span className="text-[10px] font-mono text-slate-400">Simulated OCR Bounding Box Layer</span>
      </div>

      {/* Full Modal Viewer */}
      <Modal
        isOpen={isFullModalOpen}
        onClose={() => setIsFullModalOpen(false)}
        title={`Evidence Inspection: ${productName || 'Package Sample'}`}
        subtitle="High Resolution Legal Metrology Label Inspection"
        size="xl"
      >
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl">
          <img
            src={imageUrl || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&auto=format&fit=crop&q=90'}
            alt="Full Evidence"
            className="max-h-[70vh] w-auto object-contain rounded-lg"
          />
        </div>
      </Modal>
    </div>
  );
}
