import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Sliders,
  Database,
  Save,
  CheckCircle2,
  Cpu,
  RefreshCw,
  ShieldCheck,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import Card from '../components/common/Card';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.settings.get();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.settings.update(settings);
      setSavedMessage('Settings successfully saved to local terminal state.');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all inspection history and restore initial demo datasets?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-mono">Loading configuration preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">System Preferences & Calibration</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-medium">
              Phase 1 Setup
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure officer credentials, compliance evaluation thresholds, and inspection simulator
          </p>
        </div>

        {savedMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{savedMessage}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Officer Profile */}
        <Card
          title="1. Enforcement Officer Identity & Jurisdiction"
          subtitle="Identity displayed on generated compliance notices and audit trails"
          icon={User}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Officer Name
              </label>
              <input
                type="text"
                value={settings.officerName}
                onChange={(e) => setSettings({ ...settings, officerName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-700/80 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Enforcement Badge / ID
              </label>
              <input
                type="text"
                value={settings.officerId}
                onChange={(e) => setSettings({ ...settings, officerId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-700/80 text-slate-100 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Designated Enforcement Zone / Directorate
              </label>
              <input
                type="text"
                value={settings.zone}
                onChange={(e) => setSettings({ ...settings, zone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-700/80 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Inspection Engine Thresholds */}
        <Card
          title="2. Verification Parameters & AI Confidence Thresholds"
          subtitle="Configure sensitivity for automated declaration verification"
          icon={Sliders}
        >
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-300">
                  Minimum OCR Confidence Threshold
                </span>
                <span className="font-mono text-blue-400 font-bold">
                  {settings.ocrConfidenceThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={settings.ocrConfidenceThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, ocrConfidenceThreshold: Number(e.target.value) })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Extractions scoring below this threshold are routed to the Needs Review officer queue.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Strict Font & Numeral Height Validation
                </span>
                <p className="text-[11px] text-slate-400">
                  Measure character heights against total Principal Display Panel area
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.strictFontMeasurement}
                onChange={(e) =>
                  setSettings({ ...settings, strictFontMeasurement: e.target.checked })
                }
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Slack-Fill & Deceptive Packaging Heuristics
                </span>
                <p className="text-[11px] text-slate-400">
                  Flag oversized non-functional package volume automatically
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoFlagSlackFill}
                onChange={(e) =>
                  setSettings({ ...settings, autoFlagSlackFill: e.target.checked })
                }
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Backend Integration Point */}
        <Card
          title="3. Backend Integration & Service Endpoint"
          subtitle="API abstraction configured in src/services/api.js"
          icon={Server}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Backend REST Endpoint
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings.apiEndpoint}
                  onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-700/80 text-slate-100 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shrink-0">
                  Mock Active
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              In Phase 1, all endpoints seamlessly respond via the mocked client engine with localStorage persistence.
            </p>
          </div>
        </Card>

        {/* Save & Reset Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={14} />
            <span>Reset Demo Datasets</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
