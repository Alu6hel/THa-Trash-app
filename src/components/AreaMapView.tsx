// ==============================================================================
// THa Trash App - In Your Area Map View (AreaMapView.tsx)
// Practical real-world geographic map powered by Leaflet & CartoDB Dark Matter.
// Features: 1-click Mark Bin, 1-click Remove Marker, Live GPS Geolocation,
// distance proximity calculations, animated route polylines & tactile audio feedback.
// ==============================================================================

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Navigation,
  Layers,
  Route,
  Compass,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  X,
  Sparkles,
} from 'lucide-react';
import { TrashBin, CollectionRoute, WasteStreamType } from '../types';
import { STREAM_INFO } from '../constants';
import { soundService } from '../services/soundService';

interface AreaMapViewProps {
  bins: TrashBin[];
  activeRoute: CollectionRoute | null;
  onAddBinMarker: (binData: Partial<TrashBin>) => void;
  onRemoveBinMarker: (binId: string) => void;
  onServiceBin: (bin: TrashBin) => void;
  onUpdateBinFill: (binId: string, newFillPct: number) => void;
  onNavigateToRoute: () => void;
}

// Haversine formula to compute distance in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const AreaMapView: React.FC<AreaMapViewProps> = ({
  bins,
  activeRoute,
  onAddBinMarker,
  onRemoveBinMarker,
  onServiceBin,
  onUpdateBinFill,
  onNavigateToRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // User location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Filter state
  const [streamFilter, setStreamFilter] = useState<string>('all');
  const [maxDistanceMeters, setMaxDistanceMeters] = useState<number>(0); // 0 = all
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Inspection
  const [selectedBin, setSelectedBin] = useState<TrashBin | null>(null);
  const [isMarkModalOpen, setIsMarkModalOpen] = useState<boolean>(false);
  const [pendingMarkerCoords, setPendingMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);

  // New Marker Form State
  const [newBinCode, setNewBinCode] = useState<string>('');
  const [newBinName, setNewBinName] = useState<string>('');
  const [newBinStream, setNewBinStream] = useState<WasteStreamType>('general');
  const [newBinCapacity, setNewBinCapacity] = useState<number>(240);
  const [newBinFill, setNewBinFill] = useState<number>(25);
  const [newBinAreaNotes, setNewBinAreaNotes] = useState<string>('');

  // Default initial center (Austin downtown campus default or first bin)
  const defaultCenter: [number, number] = useMemo(() => {
    if (bins.length > 0 && bins[0].location.coordinates) {
      return [bins[0].location.coordinates.lat, bins[0].location.coordinates.lng];
    }
    return [30.2850, -97.7375];
  }, [bins]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 16,
      zoomControl: false,
    });

    // High contrast modern dark tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer group for bin markers
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Click on map opens "Mark Trash Bin Here"
    map.on('click', (e: L.LeafletMouseEvent) => {
      setPendingMarkerCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      setNewBinCode(`BIN-AREA-${Math.floor(100 + Math.random() * 900)}`);
      setNewBinName('Local Area Receptacle');
      setNewBinAreaNotes(`Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`);
      setIsMarkModalOpen(true);
      soundService.playScanBeep();
    });

    mapInstanceRef.current = map;

    // Trigger initial geolocation check
    locateUser();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Geolocation trigger
  const locateUser = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by this browser.');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 16, { duration: 1.2 });

          // Render or move user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([coords.lat, coords.lng]);
          } else {
            const userIcon = L.divIcon({
              className: 'custom-user-marker',
              html: `
                <div style="position: relative; width: 22px; height: 22px;">
                  <div style="position: absolute; inset: 0; background: #3b82f6; border-radius: 9999px; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                  <div style="position: absolute; inset: 2px; background: #60a5fa; border: 3px solid #ffffff; border-radius: 9999px; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>
                </div>
              `,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            });

            const marker = L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(mapInstanceRef.current);
            marker.bindTooltip('You Are Here (GPS Active)', { permanent: false, direction: 'top' });
            userMarkerRef.current = marker;
          }
        }
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setLocationError('Could not acquire GPS position. Centering on active facility.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Filtered Bins
  const filteredBins = useMemo(() => {
    return bins.filter((b) => {
      // Stream filter
      if (streamFilter !== 'all' && b.stream !== streamFilter) return false;

      // Query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(query);
        const matchesCode = b.code.toLowerCase().includes(query);
        const matchesArea = b.location.roomOrArea.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesArea) return false;
      }

      // Distance filter
      if (maxDistanceMeters > 0 && userLocation && b.location.coordinates) {
        const dist = getDistanceMeters(
          userLocation.lat,
          userLocation.lng,
          b.location.coordinates.lat,
          b.location.coordinates.lng
        );
        if (dist > maxDistanceMeters) return false;
      }

      return true;
    });
  }, [bins, streamFilter, searchQuery, maxDistanceMeters, userLocation]);

  // Update Markers on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    filteredBins.forEach((bin) => {
      // Determine coordinates
      const coords = bin.location.coordinates || {
        lat: defaultCenter[0] + ((bin.numericId % 7) - 3) * 0.0015,
        lng: defaultCenter[1] + (((bin.numericId * 3) % 7) - 3) * 0.0015,
      };

      const streamMeta = STREAM_INFO[bin.stream];
      const isCritical = bin.currentFillPct >= 85;
      const isAttention = bin.currentFillPct >= 70 && !isCritical;

      const markerColor = isCritical ? '#ef4444' : isAttention ? '#f59e0b' : streamMeta.color;

      const html = `
        <div style="
          position: relative;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          min-height: 48px;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        ">
          ${
            isCritical
              ? `<div style="position: absolute; width: 40px; height: 40px; top: 0px; background: rgba(239, 68, 68, 0.4); border-radius: 9999px; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
              : ''
          }
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 9999px;
            background: #0f172a;
            border: 3px solid ${markerColor};
            box-shadow: 0 4px 14px rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            font-family: monospace;
          ">
            ${bin.currentFillPct}%
          </div>
          <div style="
            margin-top: 3px;
            background: rgba(15, 23, 42, 0.9);
            padding: 2px 6px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.2);
            color: #e2e8f0;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            letter-spacing: -0.2px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          ">
            ${bin.code}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-bin-marker',
        html,
        iconSize: [44, 52],
        iconAnchor: [22, 26],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon });

      marker.on('click', () => {
        setSelectedBin(bin);
        soundService.playScanBeep();
      });

      markersGroup.addLayer(marker);
    });

    // Update Route Polyline
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (activeRoute && activeRoute.stops.length > 1) {
      const routePoints: [number, number][] = [];
      activeRoute.stops.forEach((stop) => {
        const bin = bins.find((b) => b.id === stop.binId);
        if (bin && bin.location.coordinates) {
          routePoints.push([bin.location.coordinates.lat, bin.location.coordinates.lng]);
        }
      });

      if (routePoints.length > 1) {
        const polyline = L.polyline(routePoints, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
        }).addTo(mapInstanceRef.current);

        routeLayerRef.current = polyline;
      }
    }
  }, [filteredBins, activeRoute, defaultCenter]);

  // Handle Mark Bin Form Submit
  const handleConfirmMarkBin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMarkerCoords) return;

    onAddBinMarker({
      code: newBinCode.trim() || `BIN-AREA-${Math.floor(100 + Math.random() * 900)}`,
      name: newBinName.trim() || 'Local Area Receptacle',
      stream: newBinStream,
      capacityLiters: Number(newBinCapacity),
      currentFillPct: Number(newBinFill),
      fillRatePerHour: 4,
      location: {
        building: 'Local District',
        floor: 'Street / Area Level',
        roomOrArea: newBinAreaNotes.trim() || 'Designated Public Receptacle',
        coordinates: pendingMarkerCoords,
      },
      tags: ['in-your-area', 'user-marked', newBinStream],
      status: newBinFill >= 85 ? 'overflowing' : newBinFill >= 70 ? 'attention' : 'normal',
    });

    soundService.playMarkerPlaced();
    setIsMarkModalOpen(false);
    setPendingMarkerCoords(null);
  };

  // Handle Remove Marker
  const handleRemoveMarker = (bin: TrashBin) => {
    soundService.playMarkerRemoved();
    onRemoveBinMarker(bin.id);
    setSelectedBin(null);
  };

  // Distance from user to selected bin
  const selectedBinDistance = useMemo(() => {
    if (!selectedBin || !userLocation || !selectedBin.location.coordinates) return null;
    return getDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      selectedBin.location.coordinates.lat,
      selectedBin.location.coordinates.lng
    );
  }, [selectedBin, userLocation]);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              In Your Area Trash Tracker
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                {filteredBins.length} Active Bins
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Tap anywhere on the map to <strong className="text-emerald-400">Mark a Trash Bin</strong> or click a pin to <strong className="text-rose-400">Remove Marker</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* GPS Locate Me Button */}
          <button
            onClick={locateUser}
            disabled={locating}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow ${
              locating
                ? 'bg-blue-600/50 text-blue-200 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Locating...' : 'Locate In My Area'}</span>
          </button>

          {/* Quick Mark at Center / Current Position */}
          <button
            onClick={() => {
              const targetCoords = userLocation || { lat: defaultCenter[0], lng: defaultCenter[1] };
              setPendingMarkerCoords(targetCoords);
              setNewBinCode(`BIN-AREA-${Math.floor(100 + Math.random() * 900)}`);
              setNewBinName('Local Area Receptacle');
              setNewBinAreaNotes('Pinned near current coordinates');
              setIsMarkModalOpen(true);
              soundService.playScanBeep();
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Mark Bin Here</span>
          </button>

          {/* View Active Route button if present */}
          {activeRoute && (
            <button
              onClick={onNavigateToRoute}
              className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Route className="w-3.5 h-3.5 text-indigo-400" />
              <span>Route Stops ({activeRoute.stops.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Distance Proximity Ribbon */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Stream:
          </span>
          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Waste Streams</option>
            <option value="general">Landfill / General</option>
            <option value="recyclables">Mixed Recyclables</option>
            <option value="compost">Organics & Compost</option>
            <option value="hazardous">Hazardous / Bio</option>
            <option value="ewaste">E-Waste & Batteries</option>
          </select>

          {/* Distance Radius */}
          {userLocation && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-slate-400 font-semibold">Within:</span>
              <select
                value={maxDistanceMeters}
                onChange={(e) => setMaxDistanceMeters(Number(e.target.value))}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value={0}>Any Distance</option>
                <option value={200}>200 Meters (Immediate)</option>
                <option value={500}>500 Meters (Walking)</option>
                <option value={1000}>1 Kilometer (Area)</option>
                <option value={2500}>2.5 Kilometers (District)</option>
              </select>
            </div>
          )}
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bin code or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {locationError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{locationError}</span>
          </div>
          <button onClick={() => setLocationError(null)} className="text-amber-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Leaflet Map Canvas */}
      <div className="relative w-full h-[580px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 10 }} />

        {/* Tactical Map Overlay HUD */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="bg-slate-900/90 border border-slate-700 backdrop-blur-md rounded-xl p-2.5 text-xs shadow-xl space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Area Telemetry Active</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Click anywhere on map to add bin
            </div>
          </div>
        </div>

        {/* Quick Legend at bottom left */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:block">
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl p-2.5 text-[11px] shadow-xl flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Normal</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">Attention (70%+)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-slate-300">Overflow (&ge;85%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Bin Action Sheet / Modal */}
      {selectedBin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  {STREAM_INFO[selectedBin.stream].label} Stream
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedBin.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Code: <strong className="text-white">{selectedBin.code}</strong> • {selectedBin.location.roomOrArea}
                </p>
                {selectedBinDistance !== null && (
                  <div className="mt-1 text-xs text-blue-400 font-mono flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{selectedBinDistance} meters away from your location</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedBin(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Fill Card & Adjuster */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Fill Capacity:</span>
                <span className={`font-mono font-bold text-base ${
                  selectedBin.currentFillPct >= 85 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {selectedBin.currentFillPct}% ({selectedBin.capacityLiters} Liters)
                </span>
              </div>

              {/* Direct Interactive Touch Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedBin.currentFillPct}
                  onChange={(e) => onUpdateBinFill(selectedBin.id, Number(e.target.value))}
                  className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 touch-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
                  <span>0% (Empty)</span>
                  <span>50%</span>
                  <span>100% (Full)</span>
                </div>
              </div>

              {/* Quick Fill Adjuster Buttons - Touch Sized */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2 text-xs">
                <span className="text-xs text-slate-400 font-semibold">Presets:</span>
                <div className="grid grid-cols-4 gap-1.5 w-full sm:w-auto">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => onUpdateBinFill(selectedBin.id, pct)}
                      className={`px-3 py-2 min-h-[38px] rounded-xl font-mono text-xs font-bold transition-all active:scale-95 border ${
                        selectedBin.currentFillPct === pct
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions: Empty vs Remove Marker */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  const bin = selectedBin;
                  setSelectedBin(null);
                  onServiceBin(bin);
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Emptied / Serviced</span>
              </button>

              <button
                onClick={() => handleRemoveMarker(selectedBin)}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/60 text-rose-300 font-semibold flex items-center justify-center gap-2 transition-all text-xs"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Remove Bin Marker from Area Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark New Receptacle Modal */}
      {isMarkModalOpen && pendingMarkerCoords && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Mark Trash Bin in Area</h3>
              </div>
              <button
                onClick={() => setIsMarkModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmMarkBin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Receptacle Code</label>
                <input
                  type="text"
                  required
                  value={newBinCode}
                  onChange={(e) => setNewBinCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Label / Area Description</label>
                <input
                  type="text"
                  required
                  value={newBinName}
                  onChange={(e) => setNewBinName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Waste Stream</label>
                  <select
                    value={newBinStream}
                    onChange={(e) => setNewBinStream(e.target.value as WasteStreamType)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="general">Landfill / General</option>
                    <option value="recyclables">Mixed Recyclables</option>
                    <option value="compost">Organics & Compost</option>
                    <option value="hazardous">Hazardous / Bio</option>
                    <option value="ewaste">E-Waste</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Volume Capacity</label>
                  <select
                    value={newBinCapacity}
                    onChange={(e) => setNewBinCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value={120}>120 Liters (Small)</option>
                    <option value={240}>240 Liters (Standard)</option>
                    <option value={360}>360 Liters (Commercial)</option>
                    <option value={400}>400 Liters (Concourse)</option>
                    <option value={600}>600 Liters (Dumpster)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Initial Fill Level: {newBinFill}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newBinFill}
                  onChange={(e) => setNewBinFill(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-slate-400 font-mono text-[11px]">
                Coordinates: {pendingMarkerCoords.lat.toFixed(5)}, {pendingMarkerCoords.lng.toFixed(5)}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMarkModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md shadow-emerald-500/20"
                >
                  Drop Marker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
