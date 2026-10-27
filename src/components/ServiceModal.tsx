// ==============================================================================
// THa Trash App - Service / Empty Bin Modal (ServiceModal.tsx)
// ==============================================================================

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Scale, User, FileText } from 'lucide-react';
import { TrashBin, ServiceLogEntry } from '../types';

interface ServiceModalProps {
  bin: TrashBin;
  onClose: () => void;
  onConfirmService: (log: Omit<ServiceLogEntry, 'id' | 'timestamp'>) => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ bin, onClose, onConfirmService }) => {
  const estimatedKg = Math.round(((bin.capacityLiters * bin.currentFillPct) / 100) * 0.22); // average ~0.22 kg/L density
  const [weightKg, setWeightKg] = useState<number>(estimatedKg || 15);
  const [technician, setTechnician] = useState<string>('Marcus Vance');
  const [hadContamination, setHadContamination] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmService({
      binId: bin.id,
      binCode: bin.code,
      stream: bin.stream,
      weightCollectedKg: Number(weightKg),
      volumeCollectedLiters: Math.round((bin.capacityLiters * bin.currentFillPct) / 100),
      technician: technician.trim() || 'Staff Technician',
      hadContamination,
      contaminationNotes: hadContamination ? notes : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Log Bin Empty & Collection</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            ✕
          </button>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 text-xs space-y-1">
          <div className="flex justify-between font-mono">
            <span className="text-slate-400">Receptacle:</span>
            <span className="font-bold text-white">{bin.code}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Location:</span>
            <span>{bin.location.building} - {bin.location.floor}</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-slate-400">Current Level:</span>
            <span className="text-emerald-400 font-bold">{bin.currentFillPct}% ({bin.capacityLiters}L Cap)</span>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1 flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>Net Collected Weight (Kilograms)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="1000"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Service Technician Name</span>
            </label>
            <input
              type="text"
              required
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Contamination Toggle */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hadContamination}
                onChange={(e) => setHadContamination(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-0"
              />
              <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Flag Waste Stream Contamination Incident</span>
              </span>
            </label>

            {hadContamination && (
              <textarea
                placeholder="Describe contamination (e.g. food waste found in paper recycling)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 mt-2"
              ></textarea>
            )}
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Reset Fill to 0%</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
