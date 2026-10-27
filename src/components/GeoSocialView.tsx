// ==============================================================================
// THa Trash App - GeoSocial CleanMap & Contractor Dispatch (GeoSocialView.tsx)
// Citizen waste reporting for ravines, hillsides, gullies & illegal dumping grounds.
// Features: Leaflet map, Social Feed, 1-Click Municipal Work Order Dispatch,
// and embedded Hauler / Collection Company Business Logistics & Payout Economics.
// ==============================================================================

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ThumbsUp,
  Users,
  DollarSign,
  TrendingUp,
  Truck,
  Wrench,
  ShieldAlert,
  Calendar,
  Compass,
  ArrowRight,
  Filter,
  Eye,
  Camera,
  Share2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import {
  TrashReport,
  WorkOrder,
  TerrainType,
  DumpSeverity,
  ReportStatus,
  WasteStreamType,
} from '../types';
import { AluEngineService } from '../services/aluEngineService';
import { soundService } from '../services/soundService';

interface GeoSocialViewProps {
  reports: TrashReport[];
  workOrders: WorkOrder[];
  onAddReport: (report: Omit<TrashReport, 'id' | 'reportedAt' | 'upvotes' | 'volunteerPledges' | 'comments'>) => void;
  onUpvoteReport: (reportId: string) => void;
  onPledgeVolunteer: (reportId: string) => void;
  onDispatchWorkOrder: (order: Omit<WorkOrder, 'id' | 'updatedAt'>) => void;
  onResolveReport: (reportId: string, afterPhotoUrl?: string) => void;
}

// Terrain Metadata & Badges
const TERRAIN_CONFIG: Record<
  TerrainType,
  { label: string; icon: string; bg: string; text: string; equipment: string[] }
> = {
  gully_ravine: {
    label: 'Gully / Ravine',
    icon: '🏞️',
    bg: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-400',
    equipment: ['High-Tension Winch Cable', '30-Yard Roll-Off Dumpster', 'Safety Rigging Harnesses'],
  },
  hillside_slope: {
    label: 'Hillside Slope',
    icon: '⛰️',
    bg: 'bg-rose-500/10 border-rose-500/30',
    text: 'text-rose-400',
    equipment: ['Hydraulic Grapple Hoist', 'Skid-Steer Track Loader', 'Heavy-Duty Chute / Sliders'],
  },
  illegal_dump: {
    label: 'Illegal Dump Site',
    icon: '⚠️',
    bg: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-400',
    equipment: ['25-Yard Rear Loader', 'Excavator / Backhoe', 'Hazmat Tier-2 PPE'],
  },
  roadside_heap: {
    label: 'Roadside Debris Mound',
    icon: '🛣️',
    bg: 'bg-blue-500/10 border-blue-500/30',
    text: 'text-blue-400',
    equipment: ['Flatbed Crane Truck', '20-Yard Roll-Off Box', 'Traffic Control Cones & Signs'],
  },
  beach_waterway: {
    label: 'Waterway / Beach',
    icon: '🏖️',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    text: 'text-cyan-400',
    equipment: ['Shallow Water Skiff / Barrier', 'High-Density Sort Sacks', 'Bio-Containment Booms'],
  },
  vacant_lot: {
    label: 'Vacant Lot / Brownfield',
    icon: '🏚️',
    bg: 'bg-slate-500/10 border-slate-500/30',
    text: 'text-slate-300',
    equipment: ['Bulldozer / Blade', 'Tandem-Axle Dump Truck', 'Site Security Chain-link Fencing'],
  },
};

const SEVERITY_CONFIG: Record<
  DumpSeverity,
  { label: string; tons: string; color: string; badge: string }
> = {
  small_heap: { label: 'Small Heap', tons: '~0.5 - 1.0 Ton', color: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  pickup_truck: { label: 'Pickup Truck Load', tons: '~1.5 - 2.5 Tons', color: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  multi_ton_mound: { label: 'Multi-Ton Mound', tons: '~3.0 - 8.0 Tons', color: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300' },
  industrial_hazmat: { label: 'Industrial / Hazmat Dump', tons: '10+ Tons Massive', color: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300' },
};

// Preset situation photos for instant selection
const PRESET_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80', label: 'Ravine Plastic Drift' },
  { url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80', label: 'Hillside Tires & Metal' },
  { url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80', label: 'Roadside Demolition Debris' },
  { url: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=800&q=80', label: 'Creek Waterway Litter' },
];

export const GeoSocialView: React.FC<GeoSocialViewProps> = ({
  reports,
  workOrders,
  onAddReport,
  onUpvoteReport,
  onPledgeVolunteer,
  onDispatchWorkOrder,
  onResolveReport,
}) => {
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const [filterTerrain, setFilterTerrain] = useState<TerrainType | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'economics'>('feed');
  const [showEconomicsMode, setShowEconomicsMode] = useState<boolean>(false);
  const [selectedReportForDispatch, setSelectedReportForDispatch] = useState<TrashReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // User GPS coordinates
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // New Report Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTerrain, setNewTerrain] = useState<TerrainType>('gully_ravine');
  const [newSeverity, setNewSeverity] = useState<DumpSeverity>('multi_ton_mound');
  const [newTons, setNewTons] = useState(3.5);
  const [newAddress, setNewAddress] = useState('');
  const [newTerrainNotes, setNewTerrainNotes] = useState('');
  const [newBounty, setNewBounty] = useState(850);
  const [newPhotoUrl, setNewPhotoUrl] = useState(PRESET_PHOTOS[0].url);
  const [selectedStreams, setSelectedStreams] = useState<WasteStreamType[]>(['general']);

  // Dispatch Work Order Modal State
  const [dispatchContractor, setDispatchContractor] = useState('Apex Environmental Hauling LLC');
  const [dispatchCrewSize, setDispatchCrewSize] = useState(3);
  const [dispatchEquipment, setDispatchEquipment] = useState<string[]>([]);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().slice(0, 10));

  // Interactive Live Profit Calculator State (Contractor Economics)
  const [calcTons, setCalcTons] = useState(5.0);
  const [calcDistance, setCalcDistance] = useState(18);
  const [calcBounty, setCalcBounty] = useState(1600);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Request user GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default fallback (Austin metropolitan center)
          setUserCoords({ lat: 30.2672, lng: -97.7431 });
        }
      );
    }
  }, []);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterTerrain !== 'all' && r.terrainType !== filterTerrain) return false;
      return true;
    });
  }, [reports, filterStatus, filterTerrain]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (activeTab !== 'map' && activeTab !== 'feed') return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = userCoords
        ? [userCoords.lat, userCoords.lng]
        : [30.2672, -97.7431];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB & OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    // Refresh markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      filteredReports.forEach((rep) => {
        const isCleaned = rep.status === 'cleaned';
        const isDispatched = rep.status === 'dispatched';

        const colorClass = isCleaned
          ? '#10b981'
          : isDispatched
          ? '#f59e0b'
          : '#ef4444';

        const iconHtml = `
          <div style="
            background: ${colorClass};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px ${colorClass}99, 0 4px 6px rgba(0,0,0,0.5);
            border: 2px solid #ffffff;
            font-size: 14px;
            cursor: pointer;
          ">
            ${TERRAIN_CONFIG[rep.terrainType].icon}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'geosocial-dump-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

        const popupContent = document.createElement('div');
        popupContent.className = 'p-3 bg-slate-900 text-slate-100 rounded-xl text-xs max-w-xs font-sans';
        popupContent.innerHTML = `
          <div class="font-bold text-sm text-white mb-1">${rep.title}</div>
          <div class="text-[11px] text-slate-400 mb-2">${rep.location.address}</div>
          <div class="flex items-center gap-1.5 mb-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
              ${TERRAIN_CONFIG[rep.terrainType].icon} ${TERRAIN_CONFIG[rep.terrainType].label}
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
              isCleaned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }">
              ${rep.status.toUpperCase()}
            </span>
          </div>
          <div class="text-[11px] text-slate-300 mb-2">Estimated Tonnage: <strong>${rep.estimatedTons} Tons</strong></div>
          <div class="text-emerald-400 font-bold mb-3">Municipal Bounty: $${rep.cleanupBounty}</div>
        `;

        const marker = L.marker([rep.location.coordinates.lat, rep.location.coordinates.lng], {
          icon: customIcon,
        }).bindPopup(popupContent);

        markersLayerRef.current?.addLayer(marker);
      });
    }
  }, [filteredReports, activeTab, userCoords]);

  // Handle Submit Report Form
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const coords = userCoords || { lat: 30.2672, lng: -97.7431 };

    onAddReport({
      title: newTitle.trim(),
      description: newDescription.trim() || 'Citizen reported illegal waste accumulation.',
      terrainType: newTerrain,
      severity: newSeverity,
      estimatedTons: Number(newTons),
      wasteComposition: selectedStreams,
      location: {
        address: newAddress.trim() || `${TERRAIN_CONFIG[newTerrain].label} Site`,
        coordinates: coords,
        terrainNotes: newTerrainNotes.trim(),
      },
      photos: [newPhotoUrl],
      reportedBy: 'Local Community Watch',
      cleanupBounty: Number(newBounty),
      status: 'reported',
    });

    soundService.playSuccessChime();
    setIsReportModalOpen(false);
    // Reset inputs
    setNewTitle('');
    setNewDescription('');
    setNewAddress('');
    setNewTerrainNotes('');
  };

  // Open Dispatch Modal for specific report
  const handleOpenDispatchModal = (report: TrashReport) => {
    setSelectedReportForDispatch(report);
    setDispatchEquipment(TERRAIN_CONFIG[report.terrainType].equipment);
  };

  // Submit Dispatch Work Order
  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForDispatch) return;

    const econ = AluEngineService.calculateCleanupEconomics(
      selectedReportForDispatch.estimatedTons,
      15, // standard 15-mile round-trip haul
      selectedReportForDispatch.cleanupBounty
    );

    onDispatchWorkOrder({
      reportId: selectedReportForDispatch.id,
      targetTitle: selectedReportForDispatch.title,
      contractorName: dispatchContractor,
      assignedCrewSize: Number(dispatchCrewSize),
      equipmentRequired: dispatchEquipment,
      status: 'crew_en_route',
      scheduledDate: dispatchDate,
      financials: {
        estimatedTons: selectedReportForDispatch.estimatedTons,
        distanceMiles: 15,
        haulCost: econ.haulCost,
        tippingCost: econ.tippingCost,
        laborCost: econ.laborCost,
        municipalPayout: econ.municipalPayout,
        netProfit: econ.netProfit,
        marginPct: econ.marginPct,
      },
      notes: `Dispatched for site remediation. Equipment: ${dispatchEquipment.join(', ')}.`,
    });

    soundService.playFanfare();
    setSelectedReportForDispatch(null);
  };

  // Live Calculator computation
  const liveEcon = useMemo(() => {
    return AluEngineService.calculateCleanupEconomics(calcTons, calcDistance, calcBounty);
  }, [calcTons, calcDistance, calcBounty]);

  const activeReportsCount = reports.filter((r) => r.status === 'reported').length;
  const inProgressCount = reports.filter((r) => r.status === 'dispatched' || r.status === 'in_progress').length;
  const cleanedCount = reports.filter((r) => r.status === 'cleaned').length;

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>GeoSocial CleanMap</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Community EcoWatch
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Citizen-powered GPS reporting for illegal trash heaps, ravines, and hillsides with seamless municipal dispatch
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            {/* Operator Economics Toggle Button */}
            <button
              onClick={() => {
                const next = !showEconomicsMode;
                setShowEconomicsMode(next);
                if (next) soundService.playScanBeep();
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                showEconomicsMode
                  ? 'bg-amber-600/30 border-amber-500/50 text-amber-200 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <DollarSign className={`w-4 h-4 ${showEconomicsMode ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Hauler Economics</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${showEconomicsMode ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300'}`}>
                {showEconomicsMode ? 'ACTIVE' : 'OFF'}
              </span>
            </button>

            {/* Report Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-900/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Report Trash Heap / Gully</span>
            </button>
          </div>
        </div>

        {/* Live Counters & Tab Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <span className="p-2 rounded-lg bg-red-500/10 text-red-400 font-bold text-sm">⚠️</span>
            <div>
              <div className="text-lg font-black text-white">{activeReportsCount}</div>
              <div className="text-[11px] text-slate-400">Needs Removal</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-sm">🚚</span>
            <div>
              <div className="text-lg font-black text-amber-400">{inProgressCount}</div>
              <div className="text-[11px] text-slate-400">Crew Dispatched</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-sm">🎉</span>
            <div>
              <div className="text-lg font-black text-emerald-400">{cleanedCount}</div>
              <div className="text-[11px] text-slate-400">Sites Cleaned!</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-sm">💰</span>
            <div>
              <div className="text-lg font-black text-indigo-300">
                ${reports.reduce((acc, r) => acc + (r.status === 'cleaned' ? r.cleanupBounty : 0), 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">Paid Out to Crews</div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between gap-2 mt-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'feed'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Social Feed & Reports
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              GeoSocial Map View
            </button>
            {showEconomicsMode && (
              <button
                onClick={() => setActiveTab('economics')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'economics'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Hauler Master Economics</span>
              </button>
            )}
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Needs Action</option>
              <option value="dispatched">Dispatched / Active</option>
              <option value="cleaned">Cleaned Up</option>
            </select>
          </div>
        </div>
      </div>

      {/* HAULER ECONOMICS BANNER (When Mode Enabled) */}
      {showEconomicsMode && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 mt-0.5">
                <Truck className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-300">Hauler & Municipal Operator Financial Mode</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    ALU Z3 PROVED
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Real-world logistics breakdown for owning and operating a commercial waste hauling business.
                  Every report below displays accurate landfill tipping fees ($65/ton), diesel transport ($3/mile),
                  crew labor ($180 fixed callout), and net contractor contractor profit margins.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('economics')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow transition-all whitespace-nowrap"
            >
              <span>Explore Full Financial Ledger &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW: MAP VIEW */}
      {activeTab === 'map' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-xs font-bold text-white">Live GeoSocial Trash Heap Map</span>
              <span className="text-[10px] text-slate-400 font-mono">({filteredReports.length} Active Sites Plotted)</span>
            </div>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Dump Here</span>
            </button>
          </div>
          <div ref={mapContainerRef} className="w-full h-[550px] relative bg-[#0b0f19]" />
        </div>
      )}

      {/* VIEW: SOCIAL FEED & REPORTS */}
      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReports.length === 0 ? (
            <div className="col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Unserviced Waste Heaps In This Filter</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                All citizen reports for this category have been cleaned or dispatched. Tap below to submit a new dump site.
              </p>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Submit New Waste Report
              </button>
            </div>
          ) : (
            filteredReports.map((report) => {
              const terrain = TERRAIN_CONFIG[report.terrainType];
              const sev = SEVERITY_CONFIG[report.severity];
              const isCleaned = report.status === 'cleaned';
              const isDispatched = report.status === 'dispatched' || report.status === 'in_progress';

              // Financial calculation via Alu formula
              const jobEcon = AluEngineService.calculateCleanupEconomics(
                report.estimatedTons,
                15,
                report.cleanupBounty
              );

              return (
                <div
                  key={report.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl group"
                >
                  <div>
                    {/* Photo Header */}
                    <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                      <img
                        src={report.photos[0] || PRESET_PHOTOS[0].url}
                        alt={report.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-md ${terrain.bg} ${terrain.text}`}>
                          {terrain.icon} {terrain.label}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md ${sev.badge}`}>
                          {sev.label} ({report.estimatedTons}t)
                        </span>
                      </div>

                      {/* Status Pill */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider backdrop-blur-md border ${
                            isCleaned
                              ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                              : isDispatched
                              ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 animate-pulse'
                              : 'bg-red-500/30 text-red-300 border-red-500/50'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>

                      {/* Location & Reported Info */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                        <div className="flex items-center gap-1 text-slate-300 truncate max-w-[70%]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{report.location.address}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(report.reportedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-5">
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>

                      {report.location.terrainNotes && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                          <Wrench className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <span>
                            <strong className="text-slate-200">Access & Machinery:</strong> {report.location.terrainNotes}
                          </span>
                        </div>
                      )}

                      {/* Before / After Photo if Cleaned */}
                      {isCleaned && report.beforeAfter && (
                        <div className="mt-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                          <div className="flex items-center justify-between text-xs text-emerald-300 font-bold mb-2">
                            <span>Verification Certificate</span>
                            <span>Verified by {report.beforeAfter.verifiedBy}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-center text-slate-400 font-bold">
                            <div>
                              <img src={report.beforeAfter.beforePhoto} className="w-full h-20 object-cover rounded-lg mb-1" />
                              <span>BEFORE</span>
                            </div>
                            <div>
                              <img src={report.beforeAfter.afterPhoto} className="w-full h-20 object-cover rounded-lg mb-1 border border-emerald-500" />
                              <span className="text-emerald-400">AFTER (CLEANED)</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* OPERATOR / CONTRACTOR ECONOMICS STRIP (Visible when enabled) */}
                      {showEconomicsMode && (
                        <div className="mt-4 p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-amber-300 flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Contractor Payout & Margin</span>
                            </span>
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-500/20 text-amber-300">
                              {jobEcon.marginPct}% NET MARGIN
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-[11px] mt-2 pt-2 border-t border-amber-500/20">
                            <div>
                              <div className="text-slate-400 text-[10px]">Municipal Bounty</div>
                              <div className="text-emerald-400 font-bold font-mono">+${report.cleanupBounty}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-[10px]">Tipping & Fuel</div>
                              <div className="text-rose-400 font-bold font-mono">-${jobEcon.tippingCost + jobEcon.haulCost}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-[10px]">Net Hauler Profit</div>
                              <div className="text-amber-300 font-bold font-mono">+${jobEcon.netProfit}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Community Footer */}
                  <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Upvote Button */}
                      <button
                        onClick={() => {
                          onUpvoteReport(report.id);
                          soundService.playScanBeep();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
                        <span>{report.upvotes}</span>
                      </button>

                      {/* Volunteer Pledge Button */}
                      <button
                        onClick={() => {
                          onPledgeVolunteer(report.id);
                          soundService.playSuccessChime();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{report.volunteerPledges} Pledges</span>
                      </button>
                    </div>

                    {/* Municipal / Contractor Dispatch Action */}
                    {!isCleaned && (
                      <div className="flex items-center gap-2">
                        {report.status === 'reported' ? (
                          <button
                            onClick={() => handleOpenDispatchModal(report)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch Crew</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onResolveReport(
                                report.id,
                                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
                              );
                              soundService.playFanfare();
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Mark Cleaned</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW: FULL HAULER MASTER BUSINESS ECONOMICS & PROFIT CALCULATOR */}
      {activeTab === 'economics' && (
        <div className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Fleet Equipment CapEx</span>
                <Truck className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white">$195k - $340k</div>
              <p className="text-xs text-slate-400 mt-1">Per Commercial Roll-Off / ASL Compactor Unit</p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>20/30-yd Container Bins:</span>
                  <span className="font-mono text-white">$6,500 ea</span>
                </div>
                <div className="flex justify-between">
                  <span>Winch Cable Hoist:</span>
                  <span className="font-mono text-white">$24,000</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Daily Operating Cost (OpEx)</span>
                <Wrench className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">$65 / Ton Tipping</div>
              <p className="text-xs text-slate-400 mt-1">County Transfer Station Disposal Fee</p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>CDL Class B Driver:</span>
                  <span className="font-mono text-white">$32.50 / hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Diesel Fuel:</span>
                  <span className="font-mono text-white">5.2 MPG ($3.85/gal)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Contractor Revenue Models</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">$175k / Mo</div>
              <p className="text-xs text-slate-400 mt-1">Average 5,000-Home Municipal Route Contract</p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Commercial Haul:</span>
                  <span className="font-mono text-white">$450 haul + overage</span>
                </div>
                <div className="flex justify-between">
                  <span>Emergency Remediation:</span>
                  <span className="font-mono text-white">$1,500 - $4,500</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Bidding & Net Profit Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Interactive Job Margin & Net Profit Simulator</h2>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400">
                Alu Math Kernel
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Estimated Waste Tonnage: <strong className="text-white font-mono">{calcTons} Tons</strong>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={calcTons}
                  onChange={(e) => setCalcTons(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Roundtrip Haul Distance: <strong className="text-white font-mono">{calcDistance} Miles</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={calcDistance}
                  onChange={(e) => setCalcDistance(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Municipal Cleanup Bounty: <strong className="text-emerald-400 font-mono">${calcBounty}</strong>
                </label>
                <input
                  type="range"
                  min="400"
                  max="5000"
                  step="50"
                  value={calcBounty}
                  onChange={(e) => setCalcBounty(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            {/* Calculated Breakdown Results */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-[11px] text-slate-500">Tipping Fee ($65/t)</div>
                <div className="text-sm font-mono font-bold text-slate-200">${liveEcon.tippingCost}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Fuel & Transit ($3/mi)</div>
                <div className="text-sm font-mono font-bold text-slate-200">${liveEcon.haulCost}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Crew Mobilization</div>
                <div className="text-sm font-mono font-bold text-slate-200">${liveEcon.laborCost}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Total Job Expenses</div>
                <div className="text-sm font-mono font-bold text-rose-400">${liveEcon.totalCost}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Net Profit & Margin</div>
                <div className="text-base font-mono font-black text-emerald-400">
                  +${liveEcon.netProfit} ({liveEcon.marginPct}%)
                </div>
              </div>
            </div>
          </div>

          {/* Active Municipal Work Orders Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" />
              <span>Active Contractor Work Orders & Remediations</span>
            </h3>

            <div className="space-y-3">
              {workOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{wo.targetTitle}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300">
                        {wo.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Assigned to: <strong className="text-slate-200">{wo.contractorName}</strong> • Crew Size:{' '}
                      <strong className="text-slate-200">{wo.assignedCrewSize} operators</strong>
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {wo.equipmentRequired.map((eq, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Payout & Net Profit:</div>
                    <div className="text-base font-mono font-black text-emerald-400">
                      ${wo.financials.municipalPayout} <span className="text-xs text-slate-400">(${wo.financials.netProfit} net)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{new Date(wo.scheduledDate).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPORT ILLEGAL DUMP / RAVINE HEAP */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-500/20 text-red-400">
                  <Plus className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-white">Report Waste Heap / Gully / Hillside</h2>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title of Report *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canyon Ravine Debris Heap"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Terrain Type</label>
                  <select
                    value={newTerrain}
                    onChange={(e) => setNewTerrain(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {Object.entries(TERRAIN_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.icon} {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Severity / Volume</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {Object.entries(SEVERITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label} ({v.tons})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Estimated Tons</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newTons}
                    onChange={(e) => setNewTons(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Municipal Bounty ($)</label>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={newBounty}
                    onChange={(e) => setNewBounty(parseInt(e.target.value) || 500)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Street Address or Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. West Barton Creek Ravine Trailhead"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Access Notes & Machinery Needed</label>
                <input
                  type="text"
                  placeholder="e.g. Steep 30-degree incline, needs winch truck and 3-man crew"
                  value={newTerrainNotes}
                  onChange={(e) => setNewTerrainNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Select Photographic Evidence</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_PHOTOS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewPhotoUrl(p.url)}
                      className={`relative rounded-xl overflow-hidden h-16 border-2 transition-all ${
                        newPhotoUrl === p.url ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-slate-700 opacity-60'
                      }`}
                    >
                      <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Detailed Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the nature of the rubbish, biohazards, runoff risks..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  Publish Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISPATCH WORK ORDER */}
      {selectedReportForDispatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Truck className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-white">Create Municipal Work Order Dispatch</h2>
              </div>
              <button
                onClick={() => setSelectedReportForDispatch(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-4 text-xs">
              <div className="font-bold text-white">{selectedReportForDispatch.title}</div>
              <div className="text-slate-400 mt-0.5">{selectedReportForDispatch.location.address}</div>
              <div className="mt-2 text-emerald-400 font-mono font-bold">
                Tonnage: {selectedReportForDispatch.estimatedTons}t • Municipal Payout: ${selectedReportForDispatch.cleanupBounty}
              </div>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Contractor / Crew Company</label>
                <input
                  type="text"
                  required
                  value={dispatchContractor}
                  onChange={(e) => setDispatchContractor(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Assigned Crew Size</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={dispatchCrewSize}
                    onChange={(e) => setDispatchCrewSize(parseInt(e.target.value) || 2)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Required Machinery & Equipment</label>
                <div className="space-y-1.5">
                  {TERRAIN_CONFIG[selectedReportForDispatch.terrainType].equipment.map((eq, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{eq}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReportForDispatch(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow"
                >
                  Dispatch Contractor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
