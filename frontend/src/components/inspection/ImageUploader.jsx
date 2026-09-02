import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, Image as ImageIcon, X, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';

const SAMPLE_PRESETS = [
  {
    name: 'Almond Cookies 200g (Compliant Sample)',
    category: 'Food & Confectionery',
    url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop&q=80',
    tag: 'Sample 1'
  },
  {
    name: 'Face Serum 50ml (Non-Compliant Sample)',
    category: 'Cosmetics & Personal Care',
    url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
    tag: 'Sample 2'
  },
  {
    name: 'Smart LED Bulb (Needs Review Sample)',
    category: 'Electronics & Hardware',
    url: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=800&auto=format&fit=crop&q=80',
    tag: 'Sample 3'
  }
];

export default function ImageUploader({
  image,
  onImageChange,
  onPresetSelect,
  className = ''
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WEBP, HEIC)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onImageChange({
        file,
        previewUrl: event.target.result,
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadedAt: new Date().toLocaleTimeString(),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {/* Native Camera input with capture="environment" for mobile/tablet back camera */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {!image ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
              : 'border-slate-700/80 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/70'
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <UploadCloud size={32} />
          </div>

          <h4 className="text-base font-semibold text-slate-200">
            Upload Package Label Image
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Drag & drop front / back packaging display panel, or browse from device
          </p>

          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all"
            >
              <ImageIcon size={16} />
              <span>Browse File</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Camera size={16} />
              <span>Capture Photo</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-4">
            Supports: JPG, PNG, WEBP (High resolution PDP panel recommended)
          </p>
        </div>
      ) : (
        /* Image Preview Card */
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 overflow-hidden">
          <div className="relative aspect-video max-h-80 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
            <img
              src={image.previewUrl || image.url}
              alt="Package preview"
              className="w-full h-full object-contain"
            />

            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 backdrop-blur-sm shadow-lg transition-all"
                title="Replace Image"
              >
                <RefreshCw size={14} />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700 backdrop-blur-sm shadow-lg transition-all"
                title="Remove Image"
              >
                <X size={16} />
              </button>
            </div>

            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-300 backdrop-blur-sm">
              <span className="text-emerald-400 font-medium">✓ Image Ready</span>
              {image.fileSize && <span className="text-slate-400 ml-2">({image.fileSize})</span>}
            </div>
          </div>
        </div>
      )}

      {/* Preset Quick Select for Testing / Demo */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
        <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-medium">
          <Sparkles size={14} className="text-amber-400" />
          <span>Quick Demo Package Samples:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onImageChange({
                  previewUrl: preset.url,
                  fileName: `${preset.name}.jpg`,
                  fileSize: '1.2 MB',
                  uploadedAt: 'Preset Sample',
                });
                if (onPresetSelect) {
                  onPresetSelect(preset);
                }
              }}
              className="text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all text-xs group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 group-hover:text-blue-400">
                  {preset.tag}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-400">
                  {preset.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-1">{preset.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
