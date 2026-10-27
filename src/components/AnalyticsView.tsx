// ==============================================================================
// THa Trash App - Analytics & Environmental Metrics (AnalyticsView.tsx)
// ==============================================================================

import React, { useState } from 'react';
import {
  BarChart3,
  Leaf,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  FileSpreadsheet,
  Globe,
  Trees,
  Car,
} from 'lucide-react';
import { ServiceLogEntry, EnvironmentalMetrics } from '../types';

interface AnalyticsViewProps {
  metrics: EnvironmentalMetrics;
  logs: ServiceLogEntry[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ metrics, logs }) => {
  const [filterStream, setFilterStream] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    if (filterStream === 'all') return true;
    if (filterStream === 'contaminated') return log.hadContamination;
    return log.stream === filterStream;
  });

  const exportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Bin Code', 'Stream', 'Weight (kg)', 'Volume (L)', 'Technician', 'Contamination', 'Notes'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      l.binCode,
      l.stream,
      l.weightCollectedKg,
      l.volumeCollectedLiters,
      `"${l.technician}"`,
      l.hadContamination ? 'YES' : 'NO',
      `"${l.contaminationNotes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tha_trash_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Equivalencies (EPA greenhouse gas equivalencies calculator)
  // 1 kg CO2e avoided ~ 2.5 miles driven by average gasoline vehicle
  // 1 tree seedling grown for 10 years absorbs ~60 kg CO2e
  const treesEquivalent = Math.max(1, Math.round(metrics.co2AvoidedKg / 60));
  const milesOffset = Math.round(metrics.co2AvoidedKg * 2.5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>Waste Diversion & Environmental Impact</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Auditing {metrics.totalTrackedKg} kg of tracked facility waste against Zero-Waste ESG targets
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center space-x-2 self-start md:self-auto transition-all"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export ESG Waste Audit (CSV)</span>
        </button>
      </div>

      {/* Primary Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Diversion Rate Visual Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider">Landfill Diversion</span>
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-4xl font-black text-emerald-400 font-mono">
              {metrics.diversionRatePct}%
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Ratio of composted, recycled, and electronic waste diverted from landfill
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Total Diverted:</span>
              <span className="font-mono font-bold text-emerald-400">
                {metrics.recycledKg + metrics.compostKg + metrics.ewasteKg} kg
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Landfilled Waste:</span>
              <span className="font-mono text-slate-300">{metrics.landfillKg} kg</span>
            </div>
          </div>
        </div>

        {/* Trees Planted Equivalency */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider">Carbon Offset</span>
              <Trees className="w-5 h-5 text-teal-400" />
            </div>
            <div className="text-4xl font-black text-teal-300 font-mono">
              {metrics.co2AvoidedKg} <span className="text-lg font-normal text-slate-400">kg CO₂e</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Equivalent to carbon sequestered by{' '}
              <strong className="text-white font-mono">{treesEquivalent} tree seedlings</strong> over 10 years
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center">
              <Car className="w-4 h-4 text-teal-400 mr-1.5" />
              Gasoline Miles Offset:
            </span>
            <span className="font-mono font-bold text-white">~{milesOffset.toLocaleString()} mi</span>
          </div>
        </div>

        {/* Stream Breakdown Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider">Weight by Stream</span>
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-4xl font-black text-white font-mono">
              {metrics.totalTrackedKg} <span className="text-lg font-normal text-slate-400">kg Total</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                Compost
              </span>
              <span className="font-mono font-bold text-slate-200">{metrics.compostKg} kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                Recycling
              </span>
              <span className="font-mono font-bold text-slate-200">{metrics.recycledKg} kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center">
                <span className="w-2 h-2 rounded-full bg-slate-500 mr-2"></span>
                Landfill
              </span>
              <span className="font-mono font-bold text-slate-200">{metrics.landfillKg} kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                E-Waste
              </span>
              <span className="font-mono font-bold text-slate-200">{metrics.ewasteKg} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Service Logs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Collection Audit Ledger</span>
            <span className="text-xs text-slate-400 font-normal">({logs.length} logged services)</span>
          </h2>

          <select
            value={filterStream}
            onChange={(e) => setFilterStream(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Service Records</option>
            <option value="contaminated">Flagged Contaminations Only</option>
            <option value="compost">Compost Stream</option>
            <option value="recyclables">Recycling Stream</option>
            <option value="general">Landfill Stream</option>
            <option value="hazardous">Hazardous Stream</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Bin Code</th>
                <th className="py-3 px-4">Stream</th>
                <th className="py-3 px-4">Weight (kg)</th>
                <th className="py-3 px-4">Volume (L)</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleString();
                return (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="py-3 px-4 font-mono text-slate-400">{dateStr}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{log.binCode}</td>
                    <td className="py-3 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {log.stream}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {log.weightCollectedKg} kg
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{log.volumeCollectedLiters} L</td>
                    <td className="py-3 px-4 text-slate-300">{log.technician}</td>
                    <td className="py-3 px-4">
                      {log.hadContamination ? (
                        <div className="flex items-center space-x-1.5 text-rose-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span title={log.contaminationNotes}>Contaminated</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Pure Stream</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
