// ==============================================================================
// THa Trash App - Facility Map View (FacilityMapView.tsx)
// Interactive 2D architectural blueprint map with live bin telemetry,
// animated collection route trail, halo status rings & click-to-place coordinates
// ==============================================================================

import React, { useState } from 'react';
import { TrashBin, CollectionRoute, WasteStreamType } from '../types';
import { STREAM_INFO } from '../constants';
import { soundService } from '../services/soundService';

interface FacilityMapViewProps {
  bins: TrashBin[];
  activeRoute: CollectionRoute | null;
  onSelectBinForService: (bin: TrashBin) => void;
  onUpdateBinCoordinates: (binId: string, mapX: number, mapY: number) => Promise<void>;
  onNavigateToRoute: () => void;
}

type FloorFilter = 'all' | '1st Floor' | '2nd Floor' | '3rd Floor' | 'Ground' | 'Basement';

export const FacilityMapView: React.FC<FacilityMapViewProps> = ({
  bins,
  activeRoute,
  onSelectBinForService,
  onUpdateBinCoordinates,
  onNavigateToRoute,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<FloorFilter>('all');
  const [selectedBin, setSelectedBin] = useState<TrashBin | null>(null);
  const [repositioningBinId, setRepositioningBinId] = useState<string | null>(null);
  const [showRouteTrail, setShowRouteTrail] = useState<boolean>(true);
  const [hoveredBin, setHoveredBin] = useState<TrashBin | null>(null);

  // Filter bins based on selected floor
  const displayedBins = bins.filter((bin) => {
    if (selectedFloor === 'all') return true;
    return bin.location.floor.toLowerCase().includes(selectedFloor.toLowerCase());
  });

  // Calculate default position if mapX/mapY missing
  const getCoordinates = (bin: TrashBin, index: number) => {
    if (bin.location.mapX !== undefined && bin.location.mapY !== undefined) {
      return { x: bin.location.mapX, y: bin.location.mapY };
    }
    // Default circular or grid arrangement fallback
    const cols = 3;
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      x: 20 + col * 30,
      y: 25 + row * 30,
    };
  };

  // Build SVG path for collection route
  const getRouteSvgPath = () => {
    if (!activeRoute || activeRoute.stops.length < 2 || !showRouteTrail) return '';
    const points: string[] = [];

    activeRoute.stops.forEach((stop) => {
      const bin = bins.find((b) => b.id === stop.binId);
      if (bin) {
        // If floor filter matches or is all
        if (selectedFloor === 'all' || bin.location.floor.toLowerCase().includes(selectedFloor.toLowerCase())) {
          const coords = getCoordinates(bin, 0);
          points.push(`${coords.x * 10},${coords.y * 6}`);
        }
      }
    });

    if (points.length < 2) return '';
    return `M ${points.join(' L ')}`;
  };

  const handleMapClick = async (
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ) => {
    if (!repositioningBinId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const clickX = ((clientX - rect.left) / rect.width) * 100;
    const clickY = ((clientY - rect.top) / rect.height) * 100;

    const boundedX = Math.max(5, Math.min(95, Math.round(clickX)));
    const boundedY = Math.max(5, Math.min(95, Math.round(clickY)));

    await onUpdateBinCoordinates(repositioningBinId, boundedX, boundedY);
    soundService.playSuccessChime();
    setRepositioningBinId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Facility Blueprint & Telemetry Map
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">LIVE GPS/IOT</span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive structural layout, real-time bin fullness halos, and dispatch path
            </p>
          </div>
        </div>

        {/* Floor Selection Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'Ground', '1st Floor', '2nd Floor', '3rd Floor', 'Basement'] as FloorFilter[]).map((floor) => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedFloor === floor
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {floor === 'all' ? 'All Floors' : floor}
            </button>
          ))}

          {/* Route Trail Toggle */}
          <button
            onClick={() => setShowRouteTrail(!showRouteTrail)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showRouteTrail
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Route Trail {showRouteTrail ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Reposition Banner if Active */}
      {repositioningBinId && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-amber-300 animate-pulse">
          <div className="flex items-center gap-2 text-sm font-medium">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Repositioning Mode: Click anywhere on the blueprint below to set new coordinates for bin #{repositioningBinId}
          </div>
          <button
            onClick={() => setRepositioningBinId(null)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Blueprint & Canvas Area */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-3xl p-6 overflow-hidden shadow-2xl">
        {/* Architectural Background Grid & Rooms */}
        <div className="relative w-full aspect-[16/9] min-h-[460px] bg-[#070d18] rounded-2xl border border-slate-800/80 overflow-hidden">
          <svg
            className="w-full h-full cursor-crosshair select-none touch-manipulation"
            viewBox="0 0 1000 600"
            onClick={handleMapClick}
            onTouchEnd={handleMapClick}
          >
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30, 58, 138, 0.15)" strokeWidth="1" />
              </pattern>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            <rect width="1000" height="600" fill="url(#grid)" />

            {/* Architectural Rooms Outline */}
            {/* West Wing: Dining & Commons */}
            <g stroke="#1e293b" strokeWidth="2" fill="rgba(15, 23, 42, 0.45)">
              <rect x="40" y="40" width="280" height="240" rx="8" />
              <text x="55" y="70" fill="#64748b" fontSize="13" fontWeight="bold">DINING COMMONS & CAFETERIA</text>
              <path d="M 40 160 L 160 160" stroke="#334155" strokeDasharray="4 4" />
              <text x="55" y="190" fill="#475569" fontSize="11">Dishwash & Tray Drop</text>
            </g>

            {/* Central Courtyard & Quad */}
            <g stroke="#1e293b" strokeWidth="2" fill="rgba(6, 78, 59, 0.08)">
              <rect x="360" y="40" width="280" height="240" rx="8" />
              <circle cx="500" cy="160" r="45" fill="none" stroke="#065f46" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="435" y="70" fill="#059669" fontSize="13" fontWeight="bold">CENTRAL PLAZA / QUAD</text>
              <text x="455" y="165" fill="#047857" fontSize="11">Fountain & Green Area</text>
            </g>

            {/* East Wing: Science & Bio Labs */}
            <g stroke="#1e293b" strokeWidth="2" fill="rgba(15, 23, 42, 0.45)">
              <rect x="680" y="40" width="280" height="240" rx="8" />
              <text x="695" y="70" fill="#64748b" fontSize="13" fontWeight="bold">SCIENCE & BIOTECH LABS</text>
              <path d="M 800 40 L 800 160" stroke="#334155" strokeDasharray="4 4" />
              <text x="705" y="190" fill="#ef4444" fontSize="11" opacity="0.8">Bio-Safety Zone 304</text>
            </g>

            {/* Southwest: Library & Study Commons */}
            <g stroke="#1e293b" strokeWidth="2" fill="rgba(15, 23, 42, 0.45)">
              <rect x="40" y="320" width="280" height="240" rx="8" />
              <text x="55" y="350" fill="#64748b" fontSize="13" fontWeight="bold">W.E.B. ACADEMIC LIBRARY</text>
              <text x="55" y="460" fill="#475569" fontSize="11">Silent Reading & Study Hub</text>
            </g>

            {/* South Central: Recreation & Athletics */}
            <g stroke="#1e293b" strokeWidth="2" fill="rgba(15, 23, 42, 0.45)">
              <rect x="360" y="320" width="280" height="240" rx="8" />
              <text x="375" y="350" fill="#64748b" fontSize="13" fontWeight="bold">RECREATION CENTER</text>
              <text x="375" y="460" fill="#475569" fontSize="11">Gymnasium & Arena Entrance</text>
            </g>

            {/* Southeast: Robotics & Makerspace */}
            <g stroke="#1e293b" strokeWidth="2" fill="rgba(15, 23, 42, 0.45)">
              <rect x="680" y="320" width="280" height="240" rx="8" />
              <text x="695" y="350" fill="#64748b" fontSize="13" fontWeight="bold">TURING HALL MAKERSPACE</text>
              <text x="695" y="460" fill="#8b5cf6" fontSize="11" opacity="0.8">Robotics & Hardware Labs</text>
            </g>

            {/* Main Corridors Breezeway */}
            <path d="M 40 300 L 960 300" stroke="#1e293b" strokeWidth="4" strokeDasharray="12 6" />
            <path d="M 340 40 L 340 560" stroke="#1e293b" strokeWidth="4" strokeDasharray="12 6" />
            <path d="M 660 40 L 660 560" stroke="#1e293b" strokeWidth="4" strokeDasharray="12 6" />

            {/* Active Route Collection Path */}
            {getRouteSvgPath() && (
              <path
                d={getRouteSvgPath()}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="4"
                strokeDasharray="8 6"
                className="animate-pulse"
                opacity="0.85"
              />
            )}

            {/* Render Bins on Map */}
            {displayedBins.map((bin, index) => {
              const coords = getCoordinates(bin, index);
              const svgX = coords.x * 10;
              const svgY = coords.y * 6;
              const isOverflowing = bin.currentFillPct >= 90;
              const isAttention = bin.currentFillPct >= 75 && bin.currentFillPct < 90;
              const streamMeta = STREAM_INFO[bin.stream];

              // Stop order in active route if present
              const routeStopIndex = activeRoute?.stops.findIndex((s) => s.binId === bin.id);
              const stopNumber = routeStopIndex !== undefined && routeStopIndex >= 0 ? routeStopIndex + 1 : null;

              return (
                <g
                  key={bin.id}
                  className="cursor-pointer transition-transform hover:scale-125 touch-manipulation"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBin(bin);
                    soundService.playScanBeep();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    setSelectedBin(bin);
                    soundService.playScanBeep();
                  }}
                  onMouseEnter={() => setHoveredBin(bin)}
                  onMouseLeave={() => setHoveredBin(null)}
                >
                  {/* Invisible Finger Hit Target (48px diameter) */}
                  <circle cx={svgX} cy={svgY} r="24" fill="transparent" />

                  {/* Halo Pulse Ring for High Fill */}
                  {isOverflowing && (
                    <circle
                      cx={svgX}
                      cy={svgY}
                      r="28"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      opacity="0.8"
                      className="animate-ping"
                    />
                  )}

                  {isAttention && (
                    <circle
                      cx={svgX}
                      cy={svgY}
                      r="24"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      opacity="0.6"
                      className="animate-pulse"
                    />
                  )}

                  {/* Outer Background Circle */}
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r="18"
                    fill="#0f172a"
                    stroke={isOverflowing ? '#ef4444' : isAttention ? '#f59e0b' : streamMeta.color}
                    strokeWidth="3"
                  />

                  {/* Inner Fill Ring */}
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r="12"
                    fill={isOverflowing ? '#ef4444' : isAttention ? '#f59e0b' : streamMeta.color}
                    opacity="0.35"
                  />

                  {/* Fill Pct or Stop Number Text */}
                  <text
                    x={svgX}
                    y={svgY + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {stopNumber !== null ? `#${stopNumber}` : `${bin.currentFillPct}%`}
                  </text>

                  {/* Bin Code Badge below marker */}
                  <text
                    x={svgX}
                    y={svgY + 30}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {bin.code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Hover Card if bin hovered */}
          {hoveredBin && !selectedBin && (
            <div
              className="absolute pointer-events-none bg-slate-900/95 border border-slate-700 backdrop-blur-md rounded-xl p-3 shadow-2xl z-30 transition-all text-xs"
              style={{
                left: `${Math.min(80, Math.max(10, getCoordinates(hoveredBin, 0).x))}%`,
                top: `${Math.min(75, Math.max(10, getCoordinates(hoveredBin, 0).y))}%`,
                transform: 'translate(-50%, -120%)',
              }}
            >
              <div className="font-bold text-white flex items-center gap-2">
                <span>{hoveredBin.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ${
                  hoveredBin.currentFillPct >= 90 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {hoveredBin.currentFillPct}% Fill
                </span>
              </div>
              <div className="text-slate-400 mt-1">
                {hoveredBin.location.building} • {hoveredBin.location.floor}
              </div>
              <div className="text-emerald-400 font-mono mt-1">
                Overflow in {hoveredBin.hoursUntilOverflow}h • Priority: {hoveredBin.priorityScore}
              </div>
            </div>
          )}
        </div>

        {/* Legend Footer */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-300">Map Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping inline-block"></span>
              <span>Overflow Alert (&ge;90%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span>Attention Needed (75-89%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span>Normal Operating Level</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-0.5 border-t-2 border-dashed border-indigo-400 inline-block"></span>
              <span>Collection Route Sequence</span>
            </div>
          </div>

          <div className="text-slate-500">
            Click any bin marker for quick actions or repositioning
          </div>
        </div>
      </div>

      {/* Selected Bin Action Sheet / Modal */}
      {selectedBin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  {STREAM_INFO[selectedBin.stream].label} Stream
                </span>
                <h3 className="text-xl font-bold text-white">{selectedBin.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Code: <span className="font-mono text-slate-200">{selectedBin.code}</span> • Floor: {selectedBin.location.floor}
                </p>
              </div>
              <button
                onClick={() => setSelectedBin(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Telemetry Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-xs">Current Fill Level</div>
                <div className={`text-2xl font-black font-mono mt-1 ${
                  selectedBin.currentFillPct >= 90 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {selectedBin.currentFillPct}%
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${selectedBin.currentFillPct >= 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${selectedBin.currentFillPct}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-xs">Overflow Horizon</div>
                <div className="text-2xl font-black font-mono mt-1 text-indigo-400">
                  {selectedBin.hoursUntilOverflow}h
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Fill velocity: +{selectedBin.fillRatePerHour}%/hr
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  const bin = selectedBin;
                  setSelectedBin(null);
                  onSelectBinForService(bin);
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Service & Empty Bin Now
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setRepositioningBinId(selectedBin.id);
                    setSelectedBin(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Reposition on Map
                </button>

                <button
                  onClick={() => {
                    setSelectedBin(null);
                    onNavigateToRoute();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  View Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
