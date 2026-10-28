// ==============================================================================
// THa Trash App - Quick Action Rudder Modal (QuickActionModal.tsx)
// Bottom sheet triggered by central floating Rudder (+) button
// ==============================================================================

import React from 'react';
import {
  MapPin,
  AlertTriangle,
  QrCode,
  Route,
  X,
  Trash2,
  Package,
} from 'lucide-react';
import { NavTab } from './Header';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onQuickMarkBin: () => void;
  onOpenScanner: () => void;
  onRunRoute: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onQuickMarkBin,
  onOpenScanner,
  onRunRoute,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold">
              +
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">Quick Actions</h3>
              <p className="text-[11px] text-slate-400">Instant facility & waste operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Mark Bin in Area */}
          <button
            onClick={() => {
              onClose();
              onQuickMarkBin();
            }}
            className="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-emerald-950/40 border border-slate-700/60 hover:border-emerald-500/50 flex flex-col items-start gap-2 transition-all active:scale-95 group text-left"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-white group-hover:text-emerald-300">
                Mark Bin in Area
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Drop GPS pin on map</p>
            </div>
          </button>

          {/* Report Trash Dump */}
          <button
            onClick={() => {
              onClose();
              onNavigateTab('geosocial');
            }}
            className="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-500/50 flex flex-col items-start gap-2 transition-all active:scale-95 group text-left"
          >
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-white group-hover:text-rose-300">
                Report Dump
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">GeoSocial cleanmap</p>
            </div>
          </button>

          {/* Live QR / Barcode Scanner */}
          <button
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            className="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-amber-950/40 border border-slate-700/60 hover:border-amber-500/50 flex flex-col items-start gap-2 transition-all active:scale-95 group text-left"
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-white group-hover:text-amber-300">
                Scan QR / Barcode
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Hardware camera HUD</p>
            </div>
          </button>

          {/* Dispatch Optimized Route */}
          <button
            onClick={() => {
              onClose();
              onRunRoute();
            }}
            className="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-indigo-950/40 border border-slate-700/60 hover:border-indigo-500/50 flex flex-col items-start gap-2 transition-all active:scale-95 group text-left"
          >
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-white group-hover:text-indigo-300">
                Dispatch Route
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Alu VRP multi-truck</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
