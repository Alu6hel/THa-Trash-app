// ==============================================================================
// THa Trash App - QR Tag & Placard Generator (QRTagModal.tsx)
// ==============================================================================

import React from 'react';
import { QrCode, Printer, X, Trash2, Cpu } from 'lucide-react';
import { TrashBin } from '../types';

interface QRTagModalProps {
  bin: TrashBin;
  onClose: () => void;
}

export const QRTagModal: React.FC<QRTagModalProps> = ({ bin, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Smart Placard & QR Tag</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Placard Card */}
        <div
          id="printable-tag"
          className="bg-white text-slate-950 rounded-2xl p-5 border-4 border-slate-900 text-center space-y-3 shadow-inner"
        >
          {/* Header Placard Banner */}
          <div className="bg-slate-950 text-white rounded-xl py-2 px-3 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold tracking-wider uppercase text-emerald-400">
              <Trash2 className="w-4 h-4" />
              <span>THa Trash App</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              ALU IOT
            </span>
          </div>

          <div>
            <div className="text-2xl font-black font-mono tracking-tight text-slate-950">
              {bin.code}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mt-0.5">
              {bin.stream} Stream • {bin.capacityLiters}L Receptacle
            </div>
          </div>

          {/* SVG Vector QR Code Graphic */}
          <div className="w-44 h-44 mx-auto bg-slate-100 rounded-xl p-2.5 border-2 border-slate-300 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 fill-current">
              {/* Corner 1 */}
              <rect x="5" y="5" width="28" height="28" rx="4" fill="#000" />
              <rect x="10" y="10" width="18" height="18" rx="2" fill="#fff" />
              <rect x="14" y="14" width="10" height="10" rx="1" fill="#000" />

              {/* Corner 2 */}
              <rect x="67" y="5" width="28" height="28" rx="4" fill="#000" />
              <rect x="72" y="10" width="18" height="18" rx="2" fill="#fff" />
              <rect x="76" y="14" width="10" height="10" rx="1" fill="#000" />

              {/* Corner 3 */}
              <rect x="5" y="67" width="28" height="28" rx="4" fill="#000" />
              <rect x="10" y="72" width="18" height="18" rx="2" fill="#fff" />
              <rect x="14" y="76" width="10" height="10" rx="1" fill="#000" />

              {/* Data Blocks Pattern */}
              <rect x="40" y="10" width="8" height="8" fill="#000" />
              <rect x="52" y="10" width="8" height="8" fill="#000" />
              <rect x="40" y="24" width="8" height="8" fill="#000" />
              <rect x="48" y="38" width="14" height="14" rx="2" fill="#10b981" />
              <rect x="12" y="44" width="8" height="8" fill="#000" />
              <rect x="24" y="52" width="8" height="8" fill="#000" />
              <rect x="40" y="64" width="8" height="8" fill="#000" />
              <rect x="56" y="64" width="8" height="8" fill="#000" />
              <rect x="72" y="44" width="8" height="8" fill="#000" />
              <rect x="84" y="54" width="8" height="8" fill="#000" />
              <rect x="68" y="76" width="12" height="12" fill="#000" />
              <rect x="48" y="84" width="8" height="8" fill="#000" />
            </svg>
          </div>

          <div className="text-[11px] font-medium text-slate-700">
            {bin.location.building} • {bin.location.floor}
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Sensor ID: {bin.sensorId || 'N/A'}
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className="pt-2 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs shadow-md flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Smart Tag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
