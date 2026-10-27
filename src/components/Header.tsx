// ==============================================================================
// THa Trash App - Header & Navigation (Header.tsx)
// Practical In-Your-Area navigation, live telemetry, and persistence controls
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
} from 'lucide-react';

export type NavTab = 'dashboard' | 'map' | 'geosocial' | 'bins' | 'disposables' | 'routes' | 'analytics';

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
  isSoundMuted,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Trash2 className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                  THa Trash App
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Cpu className="w-3 h-3 mr-1" />
                  ALU v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                In Your Area Trash Tracker & Disposables Logistics
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Area Map & GeoSocial CleanMap prominently featured */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>Command</span>
            </button>

            {/* In Your Area Map Tab */}
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'map'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Area Map</span>
            </button>

            {/* GeoSocial CleanMap Tab */}
            <button
              onClick={() => setActiveTab('geosocial')}
              className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'geosocial'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-4 h-4 text-rose-400" />
              <span>GeoSocial</span>
              {pendingReportsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  {pendingReportsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('bins')}
              className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'bins'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Bins</span>
              {overflowingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  {overflowingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('disposables')}
              className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'disposables'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Disposables</span>
              {lowStockCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('routes')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'routes'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Route className="w-4 h-4" />
              <span>Route</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Metrics</span>
            </button>
          </nav>

          {/* Quick Actions & Telemetry Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Quick Mark Bin in Area */}
            <button
              onClick={onQuickMarkBin}
              title="Mark Trash Bin in Your Area"
              className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all flex items-center gap-1.5 text-xs shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xl:inline">Mark Bin</span>
            </button>

            {/* Sound Mute / Unmute Toggle */}
            <button
              onClick={onToggleSound}
              title={isSoundMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-all"
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Simulation Toggle */}
            <button
              onClick={onToggleSimulation}
              title={isSimulating ? 'Pause IoT Ultrasonic Sensor Pings' : 'Start Simulated IoT Sensor Pings'}
              className={`p-2 rounded-lg border text-xs font-mono flex items-center space-x-1.5 transition-all ${
                isSimulating
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isSimulating ? 'text-emerald-400 animate-pulse' : ''}`} />
              <span className="hidden lg:inline">{isSimulating ? 'IoT Live' : 'IoT Idle'}</span>
            </button>

            {/* Alu Engine Force Recalculate */}
            <button
              onClick={onTriggerAluCheck}
              title="Run Alu Z3-Proven Optimization Pass"
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-300 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Data Management Modal */}
            <button
              onClick={onOpenDataModal}
              title="Export, Import, Facility Presets, or Reset Data"
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-all"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
