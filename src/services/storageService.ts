// ==============================================================================
// THa Trash App - Storage Service (storageService.ts)
// Offline-first persistence using idb-keyval (IndexedDB) with localStorage fallback
// ==============================================================================

import { get, set } from 'idb-keyval';
import { TrashBin, DisposableItem, ServiceLogEntry, CollectionRoute } from '../types';
import { AluEngineService } from './aluEngineService';

const KEYS = {
  BINS: 'tha_trash_bins_v1',
  DISPOSABLES: 'tha_trash_disposables_v1',
  LOGS: 'tha_trash_logs_v1',
  ACTIVE_ROUTE: 'tha_trash_active_route_v1',
};

// Realistic Seed Dataset for a Smart Campus / Enterprise Facility
export const SEED_BINS: TrashBin[] = [
  {
    id: 'bin-1',
    numericId: 101,
    code: 'BIN-CAFE-01',
    name: 'Cafeteria Compost & Food Scraps',
    location: { building: 'Dining Commons', floor: '1st Floor', roomOrArea: 'Tray Drop Area', mapX: 25, mapY: 35 },
    stream: 'compost',
    capacityLiters: 240,
    currentFillPct: 92,
    fillRatePerHour: 6,
    lastEmptiedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    nextScheduledPickup: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    sensorId: 'IOT-US-9821',
    sensorBatteryPct: 88,
    status: 'overflowing',
    priorityScore: 0,
    hoursUntilOverflow: 0,
    tags: ['cafeteria', 'high-priority', 'organics'],
  },
  {
    id: 'bin-2',
    numericId: 102,
    code: 'BIN-LAB-04',
    name: 'Biotech Lab Contaminated Waste',
    location: { building: 'Science Pavilion', floor: '3rd Floor', roomOrArea: 'Bio-Safety Room 304', mapX: 75, mapY: 28 },
    stream: 'hazardous',
    capacityLiters: 120,
    currentFillPct: 78,
    fillRatePerHour: 4,
    lastEmptiedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    nextScheduledPickup: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    sensorId: 'IOT-US-4412',
    sensorBatteryPct: 95,
    status: 'attention',
    priorityScore: 0,
    hoursUntilOverflow: 0,
    tags: ['laboratory', 'biohazard', 'critical'],
  },
  {
    id: 'bin-3',
    numericId: 103,
    code: 'BIN-QUAD-02',
    name: 'Main Quad Outdoor General Waste',
    location: { building: 'Central Plaza', floor: 'Ground', roomOrArea: 'Breezeway North', mapX: 50, mapY: 55 },
    stream: 'general',
    capacityLiters: 360,
    currentFillPct: 88,
    fillRatePerHour: 5,
    lastEmptiedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    nextScheduledPickup: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    sensorId: 'IOT-US-1092',
    sensorBatteryPct: 76,
    status: 'overflowing',
    priorityScore: 0,
    hoursUntilOverflow: 0,
    tags: ['outdoor', 'general', 'high-traffic'],
  },
  {
    id: 'bin-4',
    numericId: 104,
    code: 'BIN-LIB-01',
    name: 'Library Mixed Paper & Cardboard',
    location: { building: 'W.E.B. Library', floor: '2nd Floor', roomOrArea: 'Study Commons', mapX: 30, mapY: 75 },
    stream: 'recyclables',
    capacityLiters: 240,
    currentFillPct: 45,
    fillRatePerHour: 2,
    lastEmptiedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    nextScheduledPickup: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    sensorId: 'IOT-US-7731',
    sensorBatteryPct: 92,
    status: 'normal',
    priorityScore: 0,
    hoursUntilOverflow: 0,
    tags: ['indoor', 'paper', 'recyclables'],
  },
  {
    id: 'bin-5',
    numericId: 105,
    code: 'BIN-ENG-03',
    name: 'Robotics Lab E-Waste & Batteries',
    location: { building: 'Turing Hall', floor: 'Basement', roomOrArea: 'Makerspace B12', mapX: 82, mapY: 72 },
    stream: 'ewaste',
    capacityLiters: 180,
    currentFillPct: 62,
    fillRatePerHour: 1,
    lastEmptiedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    nextScheduledPickup: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    sensorId: 'IOT-US-3390',
    sensorBatteryPct: 81,
    status: 'normal',
    priorityScore: 0,
    hoursUntilOverflow: 0,
    tags: ['electronics', 'lithium-batteries', 'makerspace'],
  },
  {
    id: 'bin-6',
    numericId: 106,
    code: 'BIN-GYM-01',
    name: 'Athletics Center Beverage Containers',
    location: { building: 'Recreation Center', floor: '1st Floor', roomOrArea: 'Gym Entrance', mapX: 62, mapY: 42 },
    stream: 'recyclables',
    capacityLiters: 240,
    currentFillPct: 84,
    fillRatePerHour: 7,
    lastEmptiedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    nextScheduledPickup: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    sensorId: 'IOT-US-5544',
    sensorBatteryPct: 69,
    status: 'attention',
    priorityScore: 0,
    hoursUntilOverflow: 0,
    tags: ['plastic-bottles', 'aluminum-cans', 'athletics'],
  },
];

export const SEED_DISPOSABLES: DisposableItem[] = [
  {
    id: 'disp-1',
    numericId: 201,
    sku: 'DISP-CUP-PLA-12',
    name: 'Certified Compostable Cold Cups (12 oz)',
    category: 'biodegradable',
    categoryAluCode: 1,
    currentStock: 480,
    unit: 'cups',
    restockThreshold: 500,
    dailyBurnRate: 65,
    daysRemaining: 7,
    costPerUnit: 0.12,
    carbonFootprintGrams: 18,
    disposalGuidance: 'Place in designated green Compost bin only.',
    targetWasteStream: 'compost',
    supplier: 'EcoProducts Direct',
  },
  {
    id: 'disp-2',
    numericId: 202,
    sku: 'DISP-GLOVE-NIT-M',
    name: 'Nitrile Lab Examination Gloves (Medium)',
    category: 'sanitary_medical',
    categoryAluCode: 4,
    currentStock: 1200,
    unit: 'pairs',
    restockThreshold: 400,
    dailyBurnRate: 80,
    daysRemaining: 15,
    costPerUnit: 0.18,
    carbonFootprintGrams: 42,
    disposalGuidance: 'Biohazard/Chemical contact must go to Red Hazardous Waste.',
    targetWasteStream: 'hazardous',
    supplier: 'Ansell Healthcare',
  },
  {
    id: 'disp-3',
    numericId: 203,
    sku: 'DISP-LINER-COM-60',
    name: 'Heavy Duty Compostable Can Liners (60 Gal)',
    category: 'biodegradable',
    categoryAluCode: 1,
    currentStock: 180,
    unit: 'bags',
    restockThreshold: 100,
    dailyBurnRate: 14,
    daysRemaining: 12,
    costPerUnit: 0.45,
    carbonFootprintGrams: 28,
    disposalGuidance: 'Industrial composting facility certified (BPI ASTM D6400).',
    targetWasteStream: 'compost',
    supplier: 'BioBag Commercial',
  },
  {
    id: 'disp-4',
    numericId: 204,
    sku: 'DISP-TOWEL-KRAFT',
    name: '100% Recycled Kraft Roll Hand Towels',
    category: 'paper',
    categoryAluCode: 3,
    currentStock: 75,
    unit: 'rolls',
    restockThreshold: 40,
    dailyBurnRate: 5,
    daysRemaining: 15,
    costPerUnit: 4.50,
    carbonFootprintGrams: 60,
    disposalGuidance: 'Compostable with organics or general landfill if soiled.',
    targetWasteStream: 'compost',
    supplier: 'Cascades PRO',
  },
  {
    id: 'disp-5',
    numericId: 205,
    sku: 'DISP-CUTLERY-CPLA',
    name: 'Heat-Resistant CPLA Cutlery Kits',
    category: 'biodegradable',
    categoryAluCode: 1,
    currentStock: 320,
    unit: 'kits',
    restockThreshold: 400,
    dailyBurnRate: 45,
    daysRemaining: 7,
    costPerUnit: 0.15,
    carbonFootprintGrams: 22,
    disposalGuidance: 'Commercial compost only. Resistant up to 185°F.',
    targetWasteStream: 'compost',
    supplier: 'World Centric',
  },
  {
    id: 'disp-6',
    numericId: 206,
    sku: 'DISP-PLASTIC-CONT',
    name: 'Clear Hinged Deli Containers (32 oz)',
    category: 'single_use_plastic',
    categoryAluCode: 2,
    currentStock: 150,
    unit: 'containers',
    restockThreshold: 300,
    dailyBurnRate: 30,
    daysRemaining: 5,
    costPerUnit: 0.22,
    carbonFootprintGrams: 85,
    disposalGuidance: 'Rinse thoroughly before placing in blue recycling.',
    targetWasteStream: 'recyclables',
    supplier: 'Dart Container',
  },
];

export const SEED_LOGS: ServiceLogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    binId: 'bin-1',
    binCode: 'BIN-CAFE-01',
    stream: 'compost',
    weightCollectedKg: 46.5,
    volumeCollectedLiters: 220,
    technician: 'Marcus Vance',
    hadContamination: false,
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    binId: 'bin-4',
    binCode: 'BIN-LIB-01',
    stream: 'recyclables',
    weightCollectedKg: 28.2,
    volumeCollectedLiters: 190,
    technician: 'Elena Rostova',
    hadContamination: false,
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    binId: 'bin-3',
    binCode: 'BIN-QUAD-02',
    stream: 'general',
    weightCollectedKg: 64.0,
    volumeCollectedLiters: 320,
    technician: 'Marcus Vance',
    hadContamination: true,
    contaminationNotes: 'Found plastic beverage bottles inside general landfill stream.',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    binId: 'bin-2',
    binCode: 'BIN-LAB-04',
    stream: 'hazardous',
    weightCollectedKg: 18.4,
    volumeCollectedLiters: 95,
    technician: 'Dr. Sarah Chen (Certified)',
    hadContamination: false,
  },
];

export class StorageService {
  private static async getWithFallback<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const val = await get<T>(key);
      if (val !== undefined && val !== null) return val;
    } catch {
      // IndexedDB fallback
    }

    try {
      const local = localStorage.getItem(key);
      if (local) return JSON.parse(local);
    } catch {
      // LocalStorage fallback
    }

    return defaultValue;
  }

  private static async setWithFallback<T>(key: string, value: T): Promise<void> {
    try {
      await set(key, value);
    } catch {
      // ignore
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  public static async loadBins(): Promise<TrashBin[]> {
    const rawBins = await this.getWithFallback<TrashBin[]>(KEYS.BINS, SEED_BINS);
    // Recalculate dynamic Alu scores upon load
    return rawBins.map((bin) => {
      const priority = AluEngineService.calculateBinPriority(
        bin.currentFillPct,
        bin.stream,
        bin.lastEmptiedAt,
        bin.fillRatePerHour
      );
      const hoursUntil = AluEngineService.calculateOverflowHours(bin.currentFillPct, bin.fillRatePerHour);
      let status = bin.status;
      if (bin.currentFillPct >= 85) status = 'overflowing';
      else if (bin.currentFillPct >= 70) status = 'attention';
      else status = 'normal';

      return {
        ...bin,
        priorityScore: priority,
        hoursUntilOverflow: hoursUntil,
        status,
      };
    });
  }

  public static async saveBins(bins: TrashBin[]): Promise<void> {
    await this.setWithFallback(KEYS.BINS, bins);
  }

  public static async loadDisposables(): Promise<DisposableItem[]> {
    const raw = await this.getWithFallback<DisposableItem[]>(KEYS.DISPOSABLES, SEED_DISPOSABLES);
    return raw.map((item) => ({
      ...item,
      daysRemaining: AluEngineService.calculateDisposableDepletion(item.currentStock, item.dailyBurnRate),
    }));
  }

  public static async saveDisposables(items: DisposableItem[]): Promise<void> {
    await this.setWithFallback(KEYS.DISPOSABLES, items);
  }

  public static async loadLogs(): Promise<ServiceLogEntry[]> {
    return await this.getWithFallback<ServiceLogEntry[]>(KEYS.LOGS, SEED_LOGS);
  }

  public static async saveLogs(logs: ServiceLogEntry[]): Promise<void> {
    await this.setWithFallback(KEYS.LOGS, logs);
  }

  public static async loadActiveRoute(): Promise<CollectionRoute | null> {
    return await this.getWithFallback<CollectionRoute | null>(KEYS.ACTIVE_ROUTE, null);
  }

  public static async saveActiveRoute(route: CollectionRoute | null): Promise<void> {
    await this.setWithFallback(KEYS.ACTIVE_ROUTE, route);
  }

  public static async loadFacilityPreset(preset: 'university' | 'hospital' | 'tech_hq' | 'stadium'): Promise<{
    bins: TrashBin[];
    disposables: DisposableItem[];
    logs: ServiceLogEntry[];
  }> {
    let presetBins: TrashBin[] = SEED_BINS;

    if (preset === 'hospital') {
      presetBins = [
        {
          id: 'bin-h1',
          numericId: 301,
          code: 'BIN-SURG-01',
          name: 'Operating Theater Surgical Biohazard',
          location: { building: 'Pavilion A', floor: '3rd Floor', roomOrArea: 'OR Suite 4', mapX: 30, mapY: 30 },
          stream: 'hazardous',
          capacityLiters: 240,
          currentFillPct: 88,
          fillRatePerHour: 8,
          lastEmptiedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          status: 'overflowing',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['surgical', 'biohazard', 'urgent'],
        },
        {
          id: 'bin-h2',
          numericId: 302,
          code: 'BIN-PHARM-02',
          name: 'Inpatient Pharmacy Chemical Disposal',
          location: { building: 'Pavilion B', floor: '1st Floor', roomOrArea: 'Clean Room 110', mapX: 70, mapY: 25 },
          stream: 'hazardous',
          capacityLiters: 120,
          currentFillPct: 65,
          fillRatePerHour: 3,
          lastEmptiedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
          status: 'normal',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['pharmaceutical', 'controlled'],
        },
        {
          id: 'bin-h3',
          numericId: 303,
          code: 'BIN-ICU-03',
          name: 'Intensive Care Medical PPE & Gowns',
          location: { building: 'Pavilion A', floor: '2nd Floor', roomOrArea: 'ICU Central', mapX: 50, mapY: 60 },
          stream: 'general',
          capacityLiters: 360,
          currentFillPct: 92,
          fillRatePerHour: 6,
          lastEmptiedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
          status: 'overflowing',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['icu', 'ppe', 'high-volume'],
        },
        {
          id: 'bin-h4',
          numericId: 304,
          code: 'BIN-CAFEMED-04',
          name: 'Dietary & Nutrition Compost Station',
          location: { building: 'Support Services', floor: 'Ground', roomOrArea: 'Kitchen Scraps', mapX: 20, mapY: 70 },
          stream: 'compost',
          capacityLiters: 240,
          currentFillPct: 74,
          fillRatePerHour: 4,
          lastEmptiedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
          status: 'attention',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['organics', 'cafeteria'],
        },
      ];
    } else if (preset === 'tech_hq') {
      presetBins = [
        {
          id: 'bin-t1',
          numericId: 401,
          code: 'BIN-DATACENTER-01',
          name: 'Main Datacenter Server Racks E-Waste',
          location: { building: 'Building Alpha', floor: 'Basement', roomOrArea: 'Server Hall 1', mapX: 25, mapY: 30 },
          stream: 'ewaste',
          capacityLiters: 240,
          currentFillPct: 82,
          fillRatePerHour: 3,
          lastEmptiedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
          status: 'attention',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['datacenter', 'electronics', 'confidential'],
        },
        {
          id: 'bin-t2',
          numericId: 402,
          code: 'BIN-KITCHEN-02',
          name: 'Microkitchen Cold Brew & Snack Compost',
          location: { building: 'Building Beta', floor: '3rd Floor', roomOrArea: 'Lounge West', mapX: 65, mapY: 35 },
          stream: 'compost',
          capacityLiters: 240,
          currentFillPct: 94,
          fillRatePerHour: 7,
          lastEmptiedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
          status: 'overflowing',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['coffee-grounds', 'food-scraps', 'microkitchen'],
        },
        {
          id: 'bin-t3',
          numericId: 403,
          code: 'BIN-DESIGN-03',
          name: 'Hardware Design 3D Filaments & Plastics',
          location: { building: 'Building Beta', floor: '1st Floor', roomOrArea: 'Prototyping Bay', mapX: 50, mapY: 55 },
          stream: 'recyclables',
          capacityLiters: 360,
          currentFillPct: 72,
          fillRatePerHour: 4,
          lastEmptiedAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
          status: 'attention',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['prototyping', 'polymers', 'hardware'],
        },
        {
          id: 'bin-t4',
          numericId: 404,
          code: 'BIN-BATTERY-05',
          name: 'Autonomous Vehicle Lab Lithium Cells',
          location: { building: 'Robotics Wing', floor: 'Ground', roomOrArea: 'Bay 12', mapX: 78, mapY: 70 },
          stream: 'ewaste',
          capacityLiters: 120,
          currentFillPct: 68,
          fillRatePerHour: 2,
          lastEmptiedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
          status: 'normal',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['lithium', 'batteries', 'high-voltage'],
        },
      ];
    } else if (preset === 'stadium') {
      presetBins = [
        {
          id: 'bin-s1',
          numericId: 501,
          code: 'BIN-GATE-A',
          name: 'North Gate Concourse Beverage Cans',
          location: { building: 'Main Arena', floor: 'Concourse 1', roomOrArea: 'Section 104', mapX: 20, mapY: 40 },
          stream: 'recyclables',
          capacityLiters: 400,
          currentFillPct: 96,
          fillRatePerHour: 15,
          lastEmptiedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
          status: 'overflowing',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['stadium', 'beverage-cans', 'event-rush'],
        },
        {
          id: 'bin-s2',
          numericId: 502,
          code: 'BIN-GATE-B',
          name: 'South Gate Concourse Plastic Cups',
          location: { building: 'Main Arena', floor: 'Concourse 1', roomOrArea: 'Section 122', mapX: 80, mapY: 40 },
          stream: 'recyclables',
          capacityLiters: 400,
          currentFillPct: 91,
          fillRatePerHour: 14,
          lastEmptiedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
          status: 'overflowing',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['stadium', 'plastics', 'event-rush'],
        },
        {
          id: 'bin-s3',
          numericId: 503,
          code: 'BIN-FOODCOURT',
          name: 'VIP Club Food Scraps & Compost',
          location: { building: 'Arena Club', floor: '2nd Floor', roomOrArea: 'Suite Catering', mapX: 50, mapY: 25 },
          stream: 'compost',
          capacityLiters: 360,
          currentFillPct: 86,
          fillRatePerHour: 8,
          lastEmptiedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          status: 'overflowing',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['catering', 'vip', 'organics'],
        },
        {
          id: 'bin-s4',
          numericId: 504,
          code: 'BIN-TAILGATE',
          name: 'South Parking Plaza Landfill Dumpster',
          location: { building: 'Outer Perimeter', floor: 'Ground', roomOrArea: 'Lot 4 North', mapX: 50, mapY: 80 },
          stream: 'general',
          capacityLiters: 600,
          currentFillPct: 85,
          fillRatePerHour: 10,
          lastEmptiedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          nextScheduledPickup: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          status: 'overflowing',
          priorityScore: 0,
          hoursUntilOverflow: 0,
          tags: ['tailgate', 'outdoor', 'high-capacity'],
        },
      ];
    }

    await this.saveBins(presetBins);
    await this.saveDisposables(SEED_DISPOSABLES);
    await this.saveLogs(SEED_LOGS);
    await this.saveActiveRoute(null);

    const bins = await this.loadBins();
    const disposables = await this.loadDisposables();
    const logs = await this.loadLogs();
    return { bins, disposables, logs };
  }

  public static async resetToDefaults(): Promise<{
    bins: TrashBin[];
    disposables: DisposableItem[];
    logs: ServiceLogEntry[];
  }> {
    return this.loadFacilityPreset('university');
  }

  public static async exportAll(): Promise<string> {
    const bins = await this.loadBins();
    const disposables = await this.loadDisposables();
    const logs = await this.loadLogs();
    const route = await this.loadActiveRoute();

    const payload = {
      app: 'THa Trash App',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      bins,
      disposables,
      logs,
      route,
    };

    return JSON.stringify(payload, null, 2);
  }

  public static async importAll(jsonStr: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonStr);
      if (data.bins && Array.isArray(data.bins)) {
        await this.saveBins(data.bins);
      }
      if (data.disposables && Array.isArray(data.disposables)) {
        await this.saveDisposables(data.disposables);
      }
      if (data.logs && Array.isArray(data.logs)) {
        await this.saveLogs(data.logs);
      }
      if (data.route !== undefined) {
        await this.saveActiveRoute(data.route);
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
}
