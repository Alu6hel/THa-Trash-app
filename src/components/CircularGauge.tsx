// ==============================================================================
// THa Trash App - Circular Gauge Component (CircularGauge.tsx)
// Cyber-clean radial dial with glowing SVG stroke and animated progress ring
// ==============================================================================

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CircularGaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: 'emerald' | 'amber' | 'rose' | 'teal' | 'indigo';
  label?: string;
  sublabel?: string;
  icon?: LucideIcon;
  unit?: string;
  className?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  max = 100,
  size = 84,
  strokeWidth = 7,
  color = 'emerald',
  label,
  sublabel,
  icon: Icon,
  unit = '%',
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(0, value), max);
  const strokeDashoffset = circumference - (clampedValue / max) * circumference;

  const colorStyles = {
    emerald: {
      stroke: '#10b981',
      glow: 'rgba(16, 185, 129, 0.4)',
      text: 'text-emerald-400',
      bgRing: 'stroke-emerald-950/40',
    },
    amber: {
      stroke: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.4)',
      text: 'text-amber-400',
      bgRing: 'stroke-amber-950/40',
    },
    rose: {
      stroke: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.4)',
      text: 'text-rose-400',
      bgRing: 'stroke-rose-950/40',
    },
    teal: {
      stroke: '#14b8a6',
      glow: 'rgba(20, 184, 166, 0.4)',
      text: 'text-teal-400',
      bgRing: 'stroke-teal-950/40',
    },
    indigo: {
      stroke: '#6366f1',
      glow: 'rgba(99, 102, 241, 0.4)',
      text: 'text-indigo-400',
      bgRing: 'stroke-indigo-950/40',
    },
  }[color];

  return (
    <div className={`flex items-center gap-3 sm:gap-4 ${className}`}>
      {/* Radial Dial */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        >
          {/* Background Track Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={`${colorStyles.bgRing} stroke-slate-800/80`}
          />

          {/* Active Glowing Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={colorStyles.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${colorStyles.glow})`,
            }}
          />
        </svg>

        {/* Center Metric Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {Icon ? (
            <Icon className={`w-5 h-5 ${colorStyles.text} mb-0.5`} />
          ) : (
            <span className={`text-base font-extrabold tracking-tight ${colorStyles.text}`}>
              {Math.round(value)}
              {unit && <span className="text-[10px] font-normal opacity-70 ml-0.5">{unit}</span>}
            </span>
          )}
        </div>
      </div>

      {/* Label and Details */}
      {(label || sublabel) && (
        <div className="flex flex-col min-w-0">
          {label && (
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 truncate">
              {label}
            </span>
          )}
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold tracking-tight text-white">
              {value}
              {unit && <span className="text-xs font-normal text-slate-400 ml-0.5">{unit}</span>}
            </span>
            {sublabel && (
              <span className="text-[11px] text-slate-400 font-mono truncate">{sublabel}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
