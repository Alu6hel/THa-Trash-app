// ==============================================================================
// THa Trash App - Command Center Dashboard (DashboardView.tsx)
// Real-time telemetry, Clean Facility Health Index, Custodial Shift status,
// and Alu-prioritized dispatch queue
// ==============================================================================

import React from 'react';
import {
  Trash2,
  AlertTriangle,
  TrendingUp,
  Leaf,
  Route,
  Zap,
  ArrowUpRight,
  Package,
  Layers,
  Cpu,
  Map,
  MapPin,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TrashBin, DisposableItem, ServiceLogEntry, EnvironmentalMetrics } from '../types';
import { AluEngineService } from '../services/aluEngineService';
import { soundService } from '../services/soundService';

interface DashboardViewProps {
  bins: TrashBin[];
  disposables: DisposableItem[];
  logs: ServiceLogEntry[];
  metrics: EnvironmentalMetrics;
  onNavigateTab: (tab: any) => void;
  onServiceBin: (bin: TrashBin) => void;
  onRunRoute: () => void;
  onQuickMarkBin: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bins,
  disposables,
  logs,
  metrics,
  onNavigateTab,
  onServiceBin,
  onRunRoute,
  onQuickMarkBin,
}) => {
  const overflowingBins = bins.filter((b) => b.currentFillPct >= 85);
  const attentionBins = bins.filter((b) => b.currentFillPct >= 70 && b.currentFillPct < 85);
  const lowStockDisposables = disposables.filter((d) => d.currentStock <= d.restockThreshold);

  // Calculate Clean Facility Health Index (0 - 100) via Alu Engine v2
  const avgFill = bins.length > 0 ? Math.round(bins.reduce((sum, b) => sum + b.currentFillPct, 0) / bins.length) : 0;
  const cleanlinessIndex = AluEngineService.calculateCleanlinessIndex(avgFill, overflowingBins.length, bins.length);

  // Top 3 urgent bins sorted by Alu Priority Score
  const urgentBins = [...bins].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3);

  // Stream counts
  const streamCounts = bins.reduce(
    (acc, b) => {
      acc[b.stream] = (acc[b.stream] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Critical */}
      {overflowingBins.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-rose-950/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-rose-200 text-sm sm:text-base">
                {overflowingBins.length} Waste Bin(s) at Critical Capacity (&ge;85%)
              </h3>
              <p className="text-xs text-rose-300/80">
                Alu route optimizer recommends immediate dispatch to avoid overflow contamination.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('map')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Map className="w-4 h-4 text-emerald-400" />
              <span>Locate on Map</span>
            </button>
            <button
              onClick={onRunRoute}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs tracking-wide shadow-md transition-all flex items-center space-x-2 shrink-0"
            >
              <Route className="w-4 h-4" />
              <span>Dispatch Route</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Clean Facility Score Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Facility Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold ${cleanlinessIndex >= 75 ? 'text-emerald-400' : cleanlinessIndex >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {cleanlinessIndex}/100
            </span>
            <span className="text-xs text-slate-400 font-mono">Alu Index</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                cleanlinessIndex >= 75 ? 'bg-emerald-500' : cleanlinessIndex >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${cleanlinessIndex}%` }}
            />
          </div>
        </div>

        {/* Diversion Rate Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Landfill Diversion</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-400">{metrics.diversionRatePct}%</span>
            <span className="text-xs text-slate-400 font-mono">Target: 75%</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.diversionRatePct)}%` }}
            />
          </div>
        </div>

        {/* Monitored Bins Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Telemetry Bins</span>
            <Trash2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{bins.length}</span>
            <span className="text-xs text-emerald-400 font-medium">IoT Active</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span>{bins.length - overflowingBins.length - attentionBins.length} Normal</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400 font-semibold">{overflowingBins.length} Critical</span>
          </div>
        </div>

        {/* Carbon Offset Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">CO₂e Avoided</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-teal-300">{metrics.co2AvoidedKg}</span>
            <span className="text-xs text-slate-400">kg GHG</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 font-mono">
            EPA WARM verified via Alu Engine
          </p>
        </div>
      </div>

      {/* Custodial Operations & Quick Launchpad */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Custodial Shift Tracker */}
        <div className="md:col-span-3 bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">Active Custodial Shift</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                  DAY SHIFT (08:00 - 16:00)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Lead Custodian: <strong className="text-slate-200">Alex Chen</strong> • Serviced Today:{' '}
                <strong className="text-emerald-400 font-mono">{logs.length} Bins</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onQuickMarkBin}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
            >
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span>Mark Bin in Area</span>
            </button>
            <button
              onClick={() => onNavigateTab('map')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Map className="w-4 h-4 text-indigo-400" />
              <span>In Your Area Map</span>
            </button>
          </div>
        </div>

        {/* Disposables Quick Stock Status */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Disposables Stock</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-white">
              {lowStockDisposables.length > 0 ? (
                <span className="text-amber-400">{lowStockDisposables.length} Low Stock</span>
              ) : (
                <span className="text-emerald-400">All Optimal</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{disposables.length} items tracked</p>
          </div>
          <button
            onClick={() => onNavigateTab('disposables')}
            className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 font-medium flex items-center gap-1"
          >
            <span>Manage Inventory &rarr;</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Urgent Dispatch & Stream Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Collection Queue */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Alu Priority Collection Dispatch</h2>
            </div>
            <button
              onClick={() => onNavigateTab('routes')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
            >
              <span>Full Route Planner</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {urgentBins.map((bin, index) => {
              const isOver = bin.currentFillPct >= 85;
              return (
                <div
                  key={bin.id}
                  className="bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-700/60 font-mono text-xs font-bold text-slate-300 flex items-center justify-center shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-100">{bin.code}</span>
                        <span className="text-xs text-slate-400">— {bin.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {bin.location.building} • {bin.location.floor} ({bin.location.roomOrArea})
                      </p>
                      <div className="flex items-center space-x-3 mt-2 text-[11px] font-mono">
                        <span className="text-slate-400">
                          Priority Score: <strong className="text-amber-400">{bin.priorityScore}</strong>
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">
                          Overflow in: <strong className={isOver ? 'text-rose-400' : 'text-slate-300'}>{bin.hoursUntilOverflow}h</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-white">{bin.currentFillPct}%</div>
                      <div className="text-[10px] text-slate-400 font-mono">{bin.capacityLiters} Liters</div>
                    </div>
                    <button
                      onClick={() => {
                        soundService.playSuccessChime();
                        onServiceBin(bin);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
                    >
                      Empty Bin
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Waste Stream Distribution Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Streams & Infrastructure</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-slate-200">Compost & Organics</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {streamCounts['compost'] || 0} Bins
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs font-medium text-slate-200">Recyclables (Plastics/Paper)</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {streamCounts['recyclables'] || 0} Bins
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="text-xs font-medium text-slate-200">General Landfill</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {streamCounts['general'] || 0} Bins
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-medium text-slate-200">Hazardous / Biohazard</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {streamCounts['hazardous'] || 0} Bins
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-xs font-medium text-slate-200">E-Waste & Batteries</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {streamCounts['ewaste'] || 0} Bins
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center">
                <Cpu className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                Alu Z3 Mathematical Safety
              </span>
              <span className="text-emerald-400 font-mono font-semibold">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
