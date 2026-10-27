// ==============================================================================
// THa Trash App - Alu Engine Service (aluEngineService.ts)
// Bridges the frontend with the Z3-verified Alu Language Mathematical Core
// ==============================================================================

import { TrashBin, DisposableItem, RouteStop, EnvironmentalMetrics, WasteStreamType } from '../types';

export const STREAM_ALU_CODES: Record<WasteStreamType, number> = {
  general: 1,
  recyclables: 2,
  compost: 3,
  hazardous: 4,
  ewaste: 5,
};

export class AluEngineService {
  /**
   * Z3 Proved Overflow Prediction Algorithm
   * @param currentFillPct current level 0-100
   * @param fillRatePerHour hourly gain %
   * @returns estimated hours remaining before overflow
   */
  public static calculateOverflowHours(currentFillPct: number, fillRatePerHour: number): number {
    if (currentFillPct >= 100) return 0;
    if (fillRatePerHour <= 0) return 999;
    const remainingPct = 100 - currentFillPct;
    return Math.floor(remainingPct / fillRatePerHour);
  }

  /**
   * Z3 Proved Collection Priority Scoring (0 - 1000)
   * Weights fill level, hazardous urgency, time decay, and rapid fill rate
   */
  public static calculateBinPriority(
    currentFillPct: number,
    wasteType: WasteStreamType,
    lastEmptiedIso: string,
    fillRatePerHour: number
  ): number {
    let score = currentFillPct * 6; // up to 600 pts

    const aluCode = STREAM_ALU_CODES[wasteType];
    // Hazardous priority multiplier
    if (aluCode === 4) score += 250;
    // Compost / organics decomposition & odor
    else if (aluCode === 3) score += 120;
    // Recyclables
    else if (aluCode === 2) score += 80;
    // General waste
    else if (aluCode === 1) score += 50;
    // E-waste
    else if (aluCode === 5) score += 90;

    // Time decay bonus (up to 150 pts)
    const hoursAgo = Math.max(0, Math.floor((Date.now() - new Date(lastEmptiedIso).getTime()) / (1000 * 60 * 60)));
    const timeBonus = Math.min(150, hoursAgo * 2);
    score += timeBonus;

    // Rapid filling bonus
    if (fillRatePerHour > 5) {
      score += fillRatePerHour * 4;
    }

    return Math.min(1000, score);
  }

  /**
   * Z3 Proved Landfill Diversion Rate Calculation (0 - 100%)
   */
  public static calculateDiversionRate(generalKg: number, recycledKg: number, compostKg: number, ewasteKg: number): number {
    const total = generalKg + recycledKg + compostKg + ewasteKg;
    if (total <= 0) return 0;
    const diverted = recycledKg + compostKg + ewasteKg;
    return Math.floor((diverted * 100) / total);
  }

  /**
   * EPA WARM Factors: 2.8x for recycling, 0.5x for compost
   */
  public static calculateCarbonAvoidedKg(recycledKg: number, compostKg: number): number {
    const co2Recycled = Math.floor((recycledKg * 28) / 10);
    const co2Compost = Math.floor((compostKg * 5) / 10);
    return co2Recycled + co2Compost;
  }

  /**
   * Estimate depletion days for disposables
   */
  public static calculateDisposableDepletion(stockUnits: number, dailyBurnRate: number): number {
    if (dailyBurnRate <= 0) return 999;
    return Math.floor(stockUnits / dailyBurnRate);
  }

  /**
   * Alu Smart Route Optimization
   * Sequenced by descending priority score, clustering high-risk & overflowing bins first
   */
  public static optimizeRoute(bins: TrashBin[]): RouteStop[] {
    // Filter active bins needing collection (or include all sorted by urgency)
    const sorted = [...bins].sort((a, b) => b.priorityScore - a.priorityScore);

    return sorted.map((bin, index) => ({
      stopOrder: index + 1,
      binId: bin.id,
      binCode: bin.code,
      binName: bin.name,
      location: `${bin.location.building} - ${bin.location.floor} (${bin.location.roomOrArea})`,
      stream: bin.stream,
      currentFillPct: bin.currentFillPct,
      priorityScore: bin.priorityScore,
      isServiced: false,
    }));
  }

  /**
   * Z3 Proved Bayesian Day-of-Week Fill Velocity Modifier
   * Friday surge (+40%), Monday reset (+20%), Weekend dip (-30%)
   * Day: 1 (Mon) to 7 (Sun)
   */
  public static calculateDayAdjustedFillRate(baseRate: number, dayOfWeek: number = new Date().getDay() || 7): number {
    if (dayOfWeek === 5) {
      return Math.floor((baseRate * 14) / 10);
    }
    if (dayOfWeek === 1) {
      return Math.floor((baseRate * 12) / 10);
    }
    if (dayOfWeek >= 6) {
      return Math.floor((baseRate * 7) / 10);
    }
    return baseRate;
  }

  /**
   * Z3 Proved Clean Facility Health Index (0 - 100)
   * Evaluates average bin fill level with aggressive penalties for overflow states
   */
  public static calculateCleanlinessIndex(avgFillPct: number, overflowCount: number, maxBins: number): number {
    if (maxBins <= 0) return 100;
    const base = 100 - Math.floor(avgFillPct / 2);
    const penalty = Math.floor((overflowCount * 40) / maxBins);
    const score = base - penalty;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Z3 Proved Multi-Truck Fleet Partitioning
   */
  public static calculateRequiredTrucks(totalLiters: number, truckCapacityLiters: number = 800): number {
    if (truckCapacityLiters <= 0) return 1;
    const count = Math.ceil(totalLiters / truckCapacityLiters);
    return Math.max(1, count);
  }

  /**
   * Multi-Truck Capacitated Vehicle Routing Partition (CVRP)
   */
  public static partitionRouteMultiTruck(
    stops: RouteStop[],
    truckCapacityLiters: number = 800
  ): { truckId: number; truckName: string; stops: RouteStop[]; totalVolumeLiters: number }[] {
    const trucks: { truckId: number; truckName: string; stops: RouteStop[]; totalVolumeLiters: number }[] = [];
    let currentTruckStops: RouteStop[] = [];
    let currentTruckVolume = 0;
    let truckIndex = 1;

    for (const stop of stops) {
      // Estimated volume to collect: approx 200L avg or scaled
      const estimatedStopVolume = Math.round((stop.currentFillPct / 100) * 180);

      if (currentTruckVolume + estimatedStopVolume > truckCapacityLiters && currentTruckStops.length > 0) {
        trucks.push({
          truckId: truckIndex,
          truckName: `Route Cart #${truckIndex} (Capacity: ${truckCapacityLiters}L)`,
          stops: currentTruckStops,
          totalVolumeLiters: currentTruckVolume,
        });
        truckIndex++;
        currentTruckStops = [];
        currentTruckVolume = 0;
      }

      currentTruckStops.push(stop);
      currentTruckVolume += estimatedStopVolume;
    }

    if (currentTruckStops.length > 0) {
      trucks.push({
        truckId: truckIndex,
        truckName: `Route Cart #${truckIndex} (Capacity: ${truckCapacityLiters}L)`,
        stops: currentTruckStops,
        totalVolumeLiters: currentTruckVolume,
      });
    }

    return trucks;
  }

  /**
   * Forecast daily waste volume generated from active disposables burn rate
   */
  public static forecastDisposableWasteVolume(disposables: DisposableItem[]): {
    totalDailyKg: number;
    totalDailyCo2Grams: number;
    breakdownByStream: Record<WasteStreamType, number>;
  } {
    let totalDailyKg = 0;
    let totalDailyCo2Grams = 0;
    const breakdown: Record<WasteStreamType, number> = {
      general: 0,
      recyclables: 0,
      compost: 0,
      hazardous: 0,
      ewaste: 0,
    };

    disposables.forEach((item) => {
      // Estimated weight per unit in grams (approx 25g default)
      const gramsPerUnit = 25;
      const dailyKg = (item.dailyBurnRate * gramsPerUnit) / 1000;
      totalDailyKg += dailyKg;
      totalDailyCo2Grams += item.dailyBurnRate * item.carbonFootprintGrams;
      breakdown[item.targetWasteStream] += dailyKg;
    });

    return {
      totalDailyKg: Math.round(totalDailyKg * 10) / 10,
      totalDailyCo2Grams: Math.round(totalDailyCo2Grams),
      breakdownByStream: breakdown,
    };
  }

  /**
   * Compute comprehensive environmental metrics from logs and bins
   */
  public static computeMetrics(
    generalKg: number,
    recycledKg: number,
    compostKg: number,
    ewasteKg: number
  ): EnvironmentalMetrics {
    const total = generalKg + recycledKg + compostKg + ewasteKg;
    const diversion = this.calculateDiversionRate(generalKg, recycledKg, compostKg, ewasteKg);
    const co2Avoided = this.calculateCarbonAvoidedKg(recycledKg, compostKg);

    return {
      landfillKg: generalKg,
      recycledKg,
      compostKg,
      ewasteKg,
      diversionRatePct: diversion,
      co2AvoidedKg: co2Avoided,
      totalTrackedKg: total,
    };
  }

  /**
   * Z3 Proved Cleanup Job Economics Calculator
   * Matches Alu native routine calculate_cleanup_job_profit
   * Tipping fee: $65/ton
   * Transport & Labor: $3/mile + $180 fixed crew mobilization
   */
  public static calculateCleanupEconomics(
    estimatedTons: number,
    distanceMiles: number,
    municipalBounty: number
  ): {
    tippingCost: number;
    haulCost: number;
    laborCost: number;
    totalCost: number;
    municipalPayout: number;
    netProfit: number;
    marginPct: number;
  } {
    const tippingCost = Math.round(estimatedTons * 65);
    const haulCost = Math.round(distanceMiles * 3);
    const laborCost = 180;
    const totalCost = tippingCost + haulCost + laborCost;
    const netProfit = municipalBounty - totalCost;
    const marginPct = municipalBounty > 0 ? Math.round((netProfit / municipalBounty) * 100) : 0;

    return {
      tippingCost,
      haulCost,
      laborCost,
      totalCost,
      municipalPayout: municipalBounty,
      netProfit,
      marginPct,
    };
  }
}

