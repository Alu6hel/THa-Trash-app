// ==============================================================================
// THa Trash App - Data & Backup Modal (DataModal.tsx)
// Multi-facility presets, JSON backup export/restore, and offline-first IndexedDB
// ==============================================================================

import React, { useState } from 'react';
import { Download, Upload, RotateCcw, X, Database, Check, Building2, Sparkles } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { soundService } from '../services/soundService';

interface DataModalProps {
  onClose: () => void;
  onDataReset: () => void;
}

export const DataModal: React.FC<DataModalProps> = ({ onClose, onDataReset }) => {
  const [importStatus, setImportStatus] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<'university' | 'hospital' | 'tech_hq' | 'stadium'>('university');

  const handleExport = async () => {
    soundService.playSuccessChime();
    const json = await StorageService.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tha_trash_app_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await StorageService.importAll(text);
      if (success) {
        soundService.playSuccessChime();
        setImportStatus('Database successfully restored from backup!');
        setTimeout(() => {
          onDataReset();
          onClose();
        }, 1200);
      } else {
        soundService.playAlertAlarm();
        setImportStatus('Invalid JSON backup file format.');
      }
    } catch {
      soundService.playAlertAlarm();
      setImportStatus('Error reading imported file.');
    }
  };

  const handleLoadPreset = async (preset: 'university' | 'hospital' | 'tech_hq' | 'stadium') => {
    setIsResetting(true);
    setActivePreset(preset);
    await StorageService.loadFacilityPreset(preset);
    soundService.playSuccessChime();
    setIsResetting(false);
    onDataReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Facility Environment & Data Management</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          THa Trash App operates 100% offline-first via browser IndexedDB. Select an industry facility profile or backup and migrate your telemetry data.
        </p>

        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Facility Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Switch Facility Archetype Profile:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLoadPreset('university')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activePreset === 'university'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 text-slate-300'
              }`}
            >
              <div className="font-bold text-xs">University Campus</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dining, Quad, Biotech Labs & Library</div>
            </button>

            <button
              onClick={() => handleLoadPreset('hospital')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activePreset === 'hospital'
                  ? 'bg-rose-950/40 border-rose-500/50 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 text-slate-300'
              }`}
            >
              <div className="font-bold text-xs text-rose-300">Metro Hospital</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Surgical Biohazards, ICU & Pharmacy</div>
            </button>

            <button
              onClick={() => handleLoadPreset('tech_hq')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activePreset === 'tech_hq'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 text-slate-300'
              }`}
            >
              <div className="font-bold text-xs text-indigo-300">Tech HQ & Datacenter</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Server E-Waste, Microkitchens & 3D Lab</div>
            </button>

            <button
              onClick={() => handleLoadPreset('stadium')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activePreset === 'stadium'
                  ? 'bg-amber-950/40 border-amber-500/50 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 text-slate-300'
              }`}
            >
              <div className="font-bold text-xs text-amber-300">Mega Sports Stadium</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Gate Concourses, Concessions & Tailgate</div>
            </button>
          </div>
        </div>

        {/* Database Operations */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-semibold text-slate-300">Backup & Restore Fleet State:</label>
          <div className="grid grid-cols-2 gap-2">
            {/* Export Button */}
            <button
              onClick={handleExport}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-left flex items-center justify-between transition-all group"
            >
              <div>
                <div className="font-semibold text-xs text-white group-hover:text-emerald-400 transition-colors">
                  Export JSON Backup
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Save all bins & logs</div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0" />
            </button>

            {/* Import File Button */}
            <label className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-left flex items-center justify-between transition-all cursor-pointer group">
              <div>
                <div className="font-semibold text-xs text-white group-hover:text-emerald-400 transition-colors">
                  Restore JSON
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Upload backup file</div>
              </div>
              <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0" />
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
