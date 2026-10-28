// ==============================================================================
// THa Trash App - Redesigned Command Center Dashboard (DashboardView.tsx)
// Simplified information hierarchy, radial circular gauges, cyber-clean cards
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
  Users,
  CheckCircle2,
  QrCode,
} from 'lucide-react';
import { TrashBin, DisposableItem, ServiceLogEntry, EnvironmentalMetrics } from '../types';
import { AluEngineService } from '../services/aluEngineService';
import { soundService } from '../services/soundService';
import { CircularGauge } from './CircularGauge';

interface DashboardViewProps {
  bins: TrashBin[];
  disposables: DisposableItem[];
  logs: ServiceLogEntry[];
  metrics: EnvironmentalMetrics;
  onNavigateTab: (tab: any) => void;
  onServiceBin: (bin: TrashBin) => void;
  onRunRoute: () => void;
  onQuickMarkBin: () => void;
  onOpenScanner?: () => void;
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
  onOpenScanner,
}) => {
  const overflowingBins = bins.filter((b) => b.currentFillPct >= 85);
  const attentionBins = bins.filter((b) => b.currentFillPct >= 70 && b.currentFillPct < 85);
  const normalBinsCount = Math.max(0, bins.length - overflowingBins.length - attentionBins.length);
  const lowStockDisposables = disposables.filter((d) => d.currentStock <= d.restockThreshold);

  // Calculate Clean Facility Health Index (0 - 100) via Alu Engine v2
  const avgFill =
    bins.length > 0 ? Math.round(bins.reduce((sum, b) => sum + b.currentFillPct, 0) / bins.length) : 0;
  const cleanlinessIndex = AluEngineService.calculateCleanlinessIndex(
    avgFill,
    overflowingBins.length,
    bins.length
  );

  // Top urgent bins sorted by Alu Priority Score
  const urgentBins = [...bins].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3);

  // Stream counts
  const streamCounts = bins.reduce(
    (acc, b) => {
      acc[b.stream] = (acc[b.stream] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const healthColor =
    cleanlinessIndex >= 75 ? 'emerald' : cleanlinessIndex >= 50 ? 'amber' : 'rose';

  return (
    <div className="space-y-5 pb-20 sm:pb-8">
      {/* 1. Critical Alert or Optimal Status Banner */}
      {overflowingBins.length > 0 ? (
        <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/20 border border-rose-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl shadow-rose-950/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                  {overflowingBins.length} Bins Overflowing (&ge;85%)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300">
                  CRITICAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Alu route optimizer ready for collection dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => onNavigateTab('map')}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Map</span>
            </button>
            <button
              onClick={onRunRoute}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs tracking-wide shadow-md shadow-rose-900/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Route className="w-3.5 h-3.5 text-slate-950" />
              <span>Dispatch Route</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-teal-950/20 border border-emerald-500/30 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Facility Status: Optimal</div>
              <p className="text-xs text-slate-400">All receptacles within capacity thresholds</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('map')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all"
          >
            <span>Inspect Map</span>
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
          </button>
        </div>
      )}

      {/* 2. Primary KPI Grid with Radial Circular Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Clean Facility Health (Radial Dial) */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-md flex items-center justify-between">
          <CircularGauge
            value={cleanlinessIndex}
            color={healthColor}
            label="FACILITY HEALTH"
            sublabel="Alu Index"
            unit="/100"
          />
          <div className="text-right">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                cleanlinessIndex >= 75
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : cleanlinessIndex >= 50
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {cleanlinessIndex >= 75 ? 'Optimal' : cleanlinessIndex >= 50 ? 'Moderate' : 'Critical'}
            </span>
            <div className="text-[10px] text-slate-500 font-mono mt-1">Z3 Verified</div>
          </div>
        </div>

        {/* Metric 2: Landfill Diversion Rate (Radial Dial) */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-md flex items-center justify-between">
          <CircularGauge
            value={metrics.diversionRatePct}
            color="emerald"
            label="DIVERSION RATE"
            sublabel="Goal: 75%"
            unit="%"
          />
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              EPA WARM
            </span>
            <div className="text-[10px] text-slate-500 font-mono mt-1">ISO 14001</div>
          </div>
        </div>

        {/* Metric 3: Monitored Bins Fleet */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Telemetry Bins</span>
            <Trash2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">{bins.length}</span>
            <span className="text-xs text-emerald-400 font-semibold font-mono">IoT Online</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {normalBinsCount} Normal
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              {overflowingBins.length} Critical
            </span>
          </div>
        </div>

        {/* Metric 4: Carbon Avoided */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">CO₂e Avoided</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-teal-300">{metrics.co2AvoidedKg}</span>
            <span className="text-xs text-slate-400 font-mono">kg GHG</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 font-mono truncate">
            Scope 3 Solid Waste Offset
          </div>
        </div>
      </div>

      {/* 3. Active Shift & Operations Launchpad */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">Active Custodial Shift</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                DAY SHIFT (08:00 - 16:00)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Lead: <strong className="text-slate-200">Alex Chen</strong> • Serviced Today:{' '}
              <strong className="text-emerald-400 font-mono">{logs.length} Bins</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onQuickMarkBin}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark Bin</span>
          </button>
          <button
            onClick={() => onNavigateTab('geosocial')}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Users className="w-3.5 h-3.5 text-rose-400" />
            <span>GeoSocial</span>
          </button>
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Scanner</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Priority Queue & Waste Stream Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Urgent Collection Queue */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                Alu Priority Collection Dispatch
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('routes')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-all"
            >
              <span>View Route Planner</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {urgentBins.map((bin, index) => {
              const isOver = bin.currentFillPct >= 85;
              return (
                <div
                  key={bin.id}
                  className="bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-xl bg-slate-700/50 font-mono text-xs font-bold text-slate-300 flex items-center justify-center shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{bin.code}</span>
                        <span className="text-xs text-slate-400">— {bin.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {bin.location.building} • {bin.location.floor} ({bin.location.roomOrArea})
                      </p>
                      <div className="flex items-center space-x-2.5 mt-1.5 text-[10px] font-mono">
                        <span className="text-slate-400">
                          Score: <strong className="text-amber-400">{bin.priorityScore}</strong>
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">
                          Overflow in:{' '}
                          <strong className={isOver ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {bin.hoursUntilOverflow}h
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-white">
                        {bin.currentFillPct}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {bin.capacityLiters}L
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        soundService.playSuccessChime();
                        onServiceBin(bin);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
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
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Stream Distribution</h2>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-300">Compost & Organics</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {streamCounts['compost'] || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-slate-300">Recyclables</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {streamCounts['recyclables'] || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs text-slate-300">General Landfill</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {streamCounts['general'] || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs text-slate-300">Hazardous</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {streamCounts['hazardous'] || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-xs text-slate-300">E-Waste</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {streamCounts['ewaste'] || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              Alu Native Core
            </span>
            <span className="text-emerald-400 font-mono font-semibold">Z3 Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
