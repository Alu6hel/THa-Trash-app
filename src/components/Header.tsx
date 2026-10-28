// ==============================================================================
// THa Trash App - Redesigned Header (Header.tsx)
// Simplified, uncluttered, mobile-first top app bar
// ==============================================================================

import React from 'react';
import {
  Trash2,
  Package,
  Route,
  BarChart3,
  RefreshCw,
  Sliders,
  Cpu,
  Radio,
  MapPin,
  Plus,
  Volume2,
  VolumeX,
  Users,
  QrCode,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'map'
  | 'geosocial'
  | 'bins'
  | 'disposables'
  | 'routes'
  | 'analytics';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  overflowingCount: number;
  lowStockCount: number;
  pendingReportsCount?: number;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onOpenDataModal: () => void;
  onTriggerAluCheck: () => void;
  onQuickMarkBin: () => void;
  onOpenScanner?: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  overflowingCount,
  lowStockCount,
  pendingReportsCount = 0,
  isSimulating,
  onToggleSimulation,
  onOpenDataModal,
  onTriggerAluCheck,
  onQuickMarkBin,
  onOpenScanner,
  isSoundMuted,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Brand - Guaranteed 1-line no wrap */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer shrink-0"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 active:scale-95 transition-transform">
              <Trash2 className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
                THa Trash
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Cpu className="w-2.5 h-2.5 mr-0.5" />
                ALU
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on small mobile screens to prevent crowding) */}
          <nav className="hidden lg:flex items-center space-x-1 py-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Command
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Area Map</span>
            </button>

            <button
              onClick={() => setActiveTab('geosocial')}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
                activeTab === 'geosocial'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span>GeoSocial</span>
              {pendingReportsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  {pendingReportsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('bins')}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
                activeTab === 'bins'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bins</span>
              {overflowingCount > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  {overflowingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('disposables')}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
                activeTab === 'disposables'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Disposables</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('routes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
                activeTab === 'routes'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>Routes</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>ESG</span>
            </button>
          </nav>

          {/* Quick Header Utility Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Quick Camera Barcode/QR Scanner */}
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                title="Open Camera Scanner"
                className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 text-amber-400 hover:text-amber-300 transition-all active:scale-95"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={isSoundMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all active:scale-95"
            >
              {isSoundMuted ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Telemetry Sensor Status Pill */}
            <button
              onClick={onToggleSimulation}
              title={isSimulating ? 'Pause IoT Sensor Telemetry' : 'Resume IoT Sensor Telemetry'}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all active:scale-95 ${
                isSimulating
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${isSimulating ? 'text-emerald-400 animate-pulse' : ''}`}
              />
              <span className="text-[11px] font-semibold hidden sm:inline">
                {isSimulating ? 'Live IoT' : 'Idle'}
              </span>
            </button>

            {/* Alu Pass Check */}
            <button
              onClick={onTriggerAluCheck}
              title="Force Alu Z3-Proof Mathematical Optimization"
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Settings & Facility Data Presets */}
            <button
              onClick={onOpenDataModal}
              title="Settings & Facility Presets"
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
