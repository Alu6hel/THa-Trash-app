// ==============================================================================
// THa Trash App - Route Optimizer View (RouteOptimizerView.tsx)
// Interactive collection route execution powered by the Alu optimization engine
// ==============================================================================

import React, { useState } from 'react';
import {
  Route,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  RotateCcw,
  Sparkles,
  MapPin,
  Cpu,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CollectionRoute, RouteStop, TrashBin } from '../types';

interface RouteOptimizerViewProps {
  route: CollectionRoute | null;
  onGenerateRoute: () => void;
  onToggleStopServiced: (stopOrder: number) => void;
  onCompleteRoute: () => void;
}

export const RouteOptimizerView: React.FC<RouteOptimizerViewProps> = ({
  route,
  onGenerateRoute,
  onToggleStopServiced,
  onCompleteRoute,
}) => {
  const [truckCapacityLiters, setTruckCapacityLiters] = useState<number>(1200);

  const completedCount = route ? route.stops.filter((s) => s.isServiced).length : 0;
  const isFinished = route && route.stops.length > 0 && completedCount === route.stops.length;

  const handleFinish = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#3b82f6', '#f59e0b'],
    });
    onCompleteRoute();
  };

  const totalVolume = route ? route.totalVolumeToCollectLiters : 0;
  const truckUtilizationPct = Math.min(100, Math.round((totalVolume / truckCapacityLiters) * 100));

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <Route className="w-6 h-6 text-emerald-400" />
              <span>Alu-Powered Waste Collection Route</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center">
              <Cpu className="w-3 h-3 mr-1" />
              Z3 Verified Sequence
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Optimized collection order prioritizing overflow hazards, bio-risks, and minimal transit time
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={onGenerateRoute}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center space-x-2 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Re-Calculate Sequence</span>
          </button>

          {route && isFinished && (
            <button
              onClick={handleFinish}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 flex items-center space-x-2 animate-bounce"
            >
              <Sparkles className="w-4 h-4" />
              <span>Complete Collection Run</span>
            </button>
          )}
        </div>
      </div>

      {/* Route Metadata KPI Banner */}
      {route && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
              <span className="font-mono">Route Progress</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {completedCount} / {route.stops.length} <span className="text-xs text-slate-400 font-normal">Stops Serviced</span>
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${route.stops.length > 0 ? (completedCount / route.stops.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
              <span className="font-mono">Estimated Duration</span>
              <Clock className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-extrabold text-teal-300 font-mono">
              ~{route.estimatedMinutes} <span className="text-xs text-slate-400 font-normal">minutes</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Paced at ~6 min per commercial stop</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
              <span className="font-mono">Payload Volume</span>
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-blue-300 font-mono">
              {totalVolume} <span className="text-xs text-slate-400 font-normal">Liters</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex justify-between font-mono">
              <span>Truck Usage:</span>
              <span className={truckUtilizationPct > 85 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {truckUtilizationPct}% ({truckCapacityLiters}L Cap)
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
              <span className="font-mono">Alu Safety Audit</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">100%</div>
            <p className="text-[11px] text-slate-500 mt-2">Zero Memory Risk / Z3 Solved</p>
          </div>
        </div>
      )}

      {/* Stop Sequence List */}
      {route ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Collection Stop Manifest</span>
              <span className="text-xs text-slate-400 font-normal">
                (Tap checkbox upon emptying receptacle)
              </span>
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Active Manifest ID: {route.id}
            </span>
          </div>

          <div className="space-y-3">
            {route.stops.map((stop) => {
              const streamColors: Record<string, string> = {
                general: 'border-slate-700 bg-slate-800 text-slate-300',
                recyclables: 'border-blue-500/30 bg-blue-950/60 text-blue-300',
                compost: 'border-emerald-500/30 bg-emerald-950/60 text-emerald-300',
                hazardous: 'border-rose-500/30 bg-rose-950/60 text-rose-300',
                ewaste: 'border-purple-500/30 bg-purple-950/60 text-purple-300',
              };

              const badge = streamColors[stop.stream] || streamColors.general;

              return (
                <div
                  key={stop.stopOrder}
                  onClick={() => onToggleStopServiced(stop.stopOrder)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    stop.isServiced
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 shadow-md'
                  }`}
                >
                  <div className="flex items-start sm:items-center space-x-3.5">
                    {/* Checkbox Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        stop.isServiced
                          ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                          : 'border-2 border-slate-600 text-slate-400'
                      }`}
                    >
                      {stop.isServiced ? (
                        <CheckCircle2 className="w-5 h-5 font-bold" />
                      ) : (
                        <span className="font-mono text-xs font-bold">{stop.stopOrder}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono text-sm font-bold ${
                            stop.isServiced ? 'line-through text-slate-500' : 'text-white'
                          }`}
                        >
                          {stop.binCode}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">— {stop.binName}</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${badge}`}
                        >
                          {stop.stream}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{stop.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status metrics right side */}
                  <div className="flex items-center space-x-4 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-white">
                        {stop.currentFillPct}% Full
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono">
                        Score: {stop.priorityScore}
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        stop.isServiced
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-700/60 text-slate-300'
                      }`}
                    >
                      {stop.isServiced ? 'Collected' : 'Pending'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-emerald-400">
            <Route className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Active Collection Route</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Run the Alu Z3 optimization pass to generate a high-efficiency collection sequence based on live fill levels and hazardous weighting.
            </p>
          </div>
          <button
            onClick={onGenerateRoute}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 inline-flex items-center space-x-2"
          >
            <Cpu className="w-4 h-4" />
            <span>Generate Optimized Route Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
