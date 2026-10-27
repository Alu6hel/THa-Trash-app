// ==============================================================================
// THa Trash App - Data & Backup Modal (DataModal.tsx)
// ==============================================================================

import React, { useState } from 'react';
import { Download, Upload, RotateCcw, X, Database, Check, AlertCircle } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface DataModalProps {
  onClose: () => void;
  onDataReset: () => void;
}

export const DataModal: React.FC<DataModalProps> = ({ onClose, onDataReset }) => {
  const [importStatus, setImportStatus] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const handleExport = async () => {
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
        setImportStatus('Database successfully restored from backup!');
        setTimeout(() => {
          onDataReset();
          onClose();
        }, 1200);
      } else {
        setImportStatus('Invalid JSON backup file format.');
      }
    } catch {
      setImportStatus('Error reading imported file.');
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    await StorageService.resetToDefaults();
    setIsResetting(false);
    onDataReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Database & Persistence Management</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          THa Trash App operates 100% offline-first using browser IndexedDB storage. You can backup, transfer, or reset your fleet data anytime.
        </p>

        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="w-full p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-left flex items-center justify-between transition-all group"
          >
            <div>
              <div className="font-semibold text-xs text-white group-hover:text-emerald-400 transition-colors">
                Export Database Snapshot (JSON)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Download all bins, disposables inventory, and service audit logs
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
          </button>

          {/* Import File Button */}
          <label className="w-full p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-left flex items-center justify-between transition-all cursor-pointer group">
            <div>
              <div className="font-semibold text-xs text-white group-hover:text-emerald-400 transition-colors">
                Import / Restore Database (JSON)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Upload a previously exported JSON backup file
              </div>
            </div>
            <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          {/* Reset to Seed Data */}
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="w-full p-3.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/30 border border-rose-900/50 hover:border-rose-700/60 text-left flex items-center justify-between transition-all group"
          >
            <div>
              <div className="font-semibold text-xs text-rose-300 group-hover:text-rose-200">
                Reset to Sample Enterprise Dataset
              </div>
              <div className="text-[11px] text-rose-400/80 mt-0.5">
                Replaces current fleet with realistic campus demo bins & disposables
              </div>
            </div>
            <RotateCcw className="w-4 h-4 text-rose-400" />
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
