// ==============================================================================
// THa Trash App - Types Definition
// ==============================================================================

export type WasteStreamType = 'general' | 'recyclables' | 'compost' | 'hazardous' | 'ewaste';

export interface WasteStreamInfo {
  id: WasteStreamType;
  aluCode: number; // 1: General, 2: Recyclables, 3: Compost, 4: Hazardous, 5: EWaste
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  hazardWeight: number;
}

export interface TrashBin {
  id: string;
  numericId: number; // for Alu engine interop
  code: string; // e.g., BIN-EAST-01
  name: string;
  location: {
    building: string;
    floor: string;
    roomOrArea: string;
    coordinates?: { lat: number; lng: number };
    mapX?: number; // 0 - 100 percentage position on floor plan
    mapY?: number; // 0 - 100 percentage position on floor plan
  };
  stream: WasteStreamType;
  capacityLiters: number;
  currentFillPct: number; // 0 - 100
  fillRatePerHour: number; // calculated or simulated percentage gain per hour
  lastEmptiedAt: string; // ISO string
  nextScheduledPickup: string; // ISO string
  sensorId?: string;
  sensorBatteryPct?: number;
  status: 'normal' | 'attention' | 'overflowing' | 'maintenance';
  priorityScore: number; // 0 - 1000 computed by Alu engine
  hoursUntilOverflow: number; // computed by Alu engine
  notes?: string;
  tags: string[];
}

export type DisposableCategory = 'biodegradable' | 'single_use_plastic' | 'paper' | 'sanitary_medical' | 'metal_foil';

export interface DisposableItem {
  id: string;
  numericId: number;
  sku: string;
  name: string;
  category: DisposableCategory;
  categoryAluCode: number;
  currentStock: number;
  unit: string; // e.g., 'units', 'boxes', 'rolls', 'packs'
  restockThreshold: number;
  dailyBurnRate: number; // units consumed/day
  daysRemaining: number; // calculated by Alu engine
  costPerUnit: number; // USD
  carbonFootprintGrams: number; // CO2e per unit disposed
  disposalGuidance: string;
  targetWasteStream: WasteStreamType;
  supplier?: string;
  lastRestockedAt?: string;
}

export interface RouteStop {
  stopOrder: number;
  binId: string;
  binCode: string;
  binName: string;
  location: string;
  stream: WasteStreamType;
  currentFillPct: number;
  priorityScore: number;
  isServiced: boolean;
  servicedAt?: string;
}

export interface CollectionRoute {
  id: string;
  name: string;
  generatedAt: string;
  stops: RouteStop[];
  totalBins: number;
  completedStops: number;
  estimatedMinutes: number;
  totalVolumeToCollectLiters: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ServiceLogEntry {
  id: string;
  timestamp: string;
  binId: string;
  binCode: string;
  stream: WasteStreamType;
  weightCollectedKg: number;
  volumeCollectedLiters: number;
  technician: string;
  hadContamination: boolean;
  contaminationNotes?: string;
}

export interface EnvironmentalMetrics {
  landfillKg: number;
  recycledKg: number;
  compostKg: number;
  ewasteKg: number;
  diversionRatePct: number; // Alu calculated
  co2AvoidedKg: number; // Alu calculated
  totalTrackedKg: number;
}

// ==============================================================================
// GeoSocial Waste Reporting & Contractor Logistics
// ==============================================================================

export type TerrainType =
  | 'gully_ravine'
  | 'hillside_slope'
  | 'illegal_dump'
  | 'roadside_heap'
  | 'beach_waterway'
  | 'vacant_lot';

export type DumpSeverity =
  | 'small_heap'
  | 'pickup_truck'
  | 'multi_ton_mound'
  | 'industrial_hazmat';

export type ReportStatus = 'reported' | 'dispatched' | 'in_progress' | 'cleaned';

export interface TrashReportComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface TrashReport {
  id: string;
  title: string;
  description: string;
  terrainType: TerrainType;
  severity: DumpSeverity;
  estimatedTons: number;
  wasteComposition: WasteStreamType[];
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
    terrainNotes?: string;
  };
  photos: string[];
  reportedBy: string;
  reportedAt: string;
  upvotes: number;
  volunteerPledges: number;
  cleanupBounty: number; // $ estimated municipal or community bounty
  status: ReportStatus;
  workOrderId?: string;
  cleanedAt?: string;
  beforeAfter?: {
    beforePhoto: string;
    afterPhoto: string;
    verifiedBy: string;
  };
  comments: TrashReportComment[];
}

export type WorkOrderStatus =
  | 'queued'
  | 'crew_en_route'
  | 'on_site'
  | 'hauling_to_transfer'
  | 'resolved';

export interface WorkOrder {
  id: string;
  reportId: string;
  targetTitle: string;
  contractorName: string;
  assignedCrewSize: number;
  equipmentRequired: string[];
  status: WorkOrderStatus;
  scheduledDate: string;
  financials: {
    estimatedTons: number;
    distanceMiles: number;
    haulCost: number;
    tippingCost: number;
    laborCost: number;
    municipalPayout: number;
    netProfit: number;
    marginPct: number;
  };
  notes?: string;
  updatedAt: string;
}

export interface HaulerEconomicsProfile {
  companyName: string;
  tippingFeePerTon: number; // e.g., $65/ton
  driverHourlyWage: number; // e.g., $32.50/hr
  helperHourlyWage: number; // e.g., $20.00/hr
  dieselPricePerGal: number; // e.g., $3.85/gal
  truckAvgMpg: number; // e.g., 5.2 MPG
  maintenancePerMile: number; // e.g., $0.62/mile
  monthlyInsurancePerTruck: number; // e.g., $1,400/mo
}

