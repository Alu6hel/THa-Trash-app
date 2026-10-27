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
