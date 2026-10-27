// ==============================================================================
// THa Trash App - Command Center Dashboard (DashboardView.tsx)
// ==============================================================================

import React from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Leaf,
  Route,
  Zap,
  ArrowUpRight,
  Package,
  Layers,
  Cpu,
} from 'lucide-react';
import { TrashBin, DisposableItem, ServiceLogEntry, EnvironmentalMetrics } from '../types';

interface DashboardViewProps {
  bins: TrashBin[];
  disposables: DisposableItem[];
  logs: ServiceLogEntry[];
  metrics: EnvironmentalMetrics;
  onNavigateTab: (tab: any) => void;
  onServiceBin: (bin: TrashBin) => void;
  onRunRoute: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bins,
  disposables,
  logs,
  metrics,
  onNavigateTab,
  onServiceBin,
  onRunRoute,
}) => {
  const overflowingBins = bins.filter((b) => b.currentFillPct >= 85);
  const attentionBins = bins.filter((b) => b.currentFillPct >= 70 && b.currentFillPct < 85);
  const lowStockDisposables = disposables.filter((d) => d.currentStock <= d.restockThreshold);

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
                {overflowingBins.length} Waste Bin(s) at Critical Capacity (≥85%)
              </h3>
              <p className="text-xs text-rose-300/80">
                Alu route optimizer recommends immediate dispatch to avoid floor contamination.
              </p>
            </div>
          </div>
          <button
            onClick={onRunRoute}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs tracking-wide shadow-md transition-all flex items-center space-x-2 shrink-0"
          >
            <Route className="w-4 h-4" />
            <span>Dispatch Collection Route</span>
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bins Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Monitored Bins</span>
            <Trash2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{bins.length}</span>
            <span className="text-xs text-emerald-400 font-medium">IoT Connected</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{bins.length - overflowingBins.length - attentionBins.length} Normal</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400 font-semibold">{overflowingBins.length} Critical</span>
          </div>
        </div>

        {/* Diversion Rate Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Diversion Rate</span>
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
            ></div>
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

        {/* Disposables Stock Alert */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Disposables Alerts</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{lowStockDisposables.length}</span>
            <span className="text-xs text-amber-400 font-medium">Restock Required</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            {disposables.length} total SKUs actively monitored
          </p>
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
              const isWarn = bin.currentFillPct >= 70 && !isOver;
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
                      onClick={() => onServiceBin(bin)}
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
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-medium text-slate-200">Compost & Organics</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {streamCounts['compost'] || 0} Bins
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-xs font-medium text-slate-200">Recyclables (Plastics/Paper)</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {streamCounts['recyclables'] || 0} Bins
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                  <span className="text-xs font-medium text-slate-200">General Landfill</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {streamCounts['general'] || 0} Bins
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="text-xs font-medium text-slate-200">Hazardous / Biohazard</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {streamCounts['hazardous'] || 0} Bins
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
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
