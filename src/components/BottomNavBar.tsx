// ==============================================================================
// THa Trash App - Bottom Rudder Navigation Bar (BottomNavBar.tsx)
// Modern floating glassmorphic dock with central Rudder (+) action button
// Inspired by mobile design patterns: Tab Bar + Rudder + Sheet
// ==============================================================================

import React, { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Plus,
  Users,
  Grid,
  Trash2,
  Package,
  Route,
  BarChart3,
  Sliders,
  X,
} from 'lucide-react';
import { NavTab } from './Header';

interface BottomNavBarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  overflowingCount: number;
  lowStockCount: number;
  pendingReportsCount: number;
  onOpenQuickAction: () => void;
  onOpenDataModal: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  overflowingCount,
  lowStockCount,
  pendingReportsCount,
  onOpenQuickAction,
  onOpenDataModal,
}) => {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const isMoreActive = ['bins', 'disposables', 'routes', 'analytics'].includes(activeTab);

  return (
    <>
      {/* Floating Bottom Dock Container */}
      <nav
        aria-label="Mobile Navigation Dock"
        className="fixed bottom-3 inset-x-0 mx-auto max-w-md px-3 z-40 pointer-events-auto"
      >
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-2 flex items-center justify-around relative">
          {/* 1. Command Center / Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-w-[56px] transition-all active:scale-95 ${
              activeTab === 'dashboard'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">Home</span>
          </button>

          {/* 2. In Your Area GPS Map */}
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-w-[56px] transition-all active:scale-95 ${
              activeTab === 'map'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">Area Map</span>
          </button>

          {/* 3. Central Rudder Floating Action Button (+) */}
          <div className="relative -mt-6">
            <button
              onClick={onOpenQuickAction}
              aria-label="Quick Action Menu"
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-emerald-400 to-teal-300 text-slate-950 font-black shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all active:scale-90 hover:scale-105 hover:shadow-emerald-500/50"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          {/* 4. GeoSocial CleanMap */}
          <button
            onClick={() => setActiveTab('geosocial')}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-w-[56px] transition-all active:scale-95 ${
              activeTab === 'geosocial'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5 text-rose-400" />
            <span className="text-[10px] font-medium tracking-tight">Social</span>
            {pendingReportsCount > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          {/* 5. More Sheet Toggle */}
          <button
            onClick={() => setIsMoreSheetOpen(true)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-w-[56px] transition-all active:scale-95 ${
              isMoreActive
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">More</span>
            {(overflowingCount > 0 || lowStockCount > 0) && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </nav>

      {/* Slide-Up "More" Sheet Modal */}
      {isMoreSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsMoreSheetOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-slate-100 mb-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <h4 className="font-bold text-sm tracking-tight text-white">More Modules</h4>
              <button
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {/* Bins Management */}
              <button
                onClick={() => {
                  setActiveTab('bins');
                  setIsMoreSheetOpen(false);
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all ${
                  activeTab === 'bins'
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-700/50 text-emerald-400">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold">Trash Bins Fleet</div>
                    <div className="text-[10px] text-slate-400">Ultrasonic telemetry & streams</div>
                  </div>
                </div>
                {overflowingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {overflowingCount} critical
                  </span>
                )}
              </button>

              {/* Disposables */}
              <button
                onClick={() => {
                  setActiveTab('disposables');
                  setIsMoreSheetOpen(false);
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all ${
                  activeTab === 'disposables'
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-700/50 text-amber-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold">Disposables Inventory</div>
                    <div className="text-[10px] text-slate-400">Burn rates & circular economy</div>
                  </div>
                </div>
                {lowStockCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {lowStockCount} low
                  </span>
                )}
              </button>

              {/* Route Optimizer */}
              <button
                onClick={() => {
                  setActiveTab('routes');
                  setIsMoreSheetOpen(false);
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all ${
                  activeTab === 'routes'
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-700/50 text-indigo-400">
                    <Route className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold">Route Optimizer (VRP)</div>
                    <div className="text-[10px] text-slate-400">Multi-truck collection sequence</div>
                  </div>
                </div>
              </button>

              {/* ESG Analytics */}
              <button
                onClick={() => {
                  setActiveTab('analytics');
                  setIsMoreSheetOpen(false);
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-700/50 text-teal-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold">ESG Sustainability Audit</div>
                    <div className="text-[10px] text-slate-400">LEED Zero Waste & EPA WARM</div>
                  </div>
                </div>
              </button>

              {/* Facility Data & Presets */}
              <button
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  onOpenDataModal();
                }}
                className="w-full p-3 rounded-2xl flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 text-slate-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-700/50 text-slate-300">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold">Settings & Facility Data</div>
                    <div className="text-[10px] text-slate-400">Presets, JSON backup & reset</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
