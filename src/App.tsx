// ==============================================================================
// THa Trash App - Main Application Shell (App.tsx)
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Header, NavTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { BinManagementView } from './components/BinManagementView';
import { DisposablesView } from './components/DisposablesView';
import { RouteOptimizerView } from './components/RouteOptimizerView';
import { AreaMapView } from './components/AreaMapView';
import { InstallAppBanner } from './components/InstallAppBanner';
import { AnalyticsView } from './components/AnalyticsView';
import { ServiceModal } from './components/ServiceModal';
import { QRTagModal } from './components/QRTagModal';
import { DataModal } from './components/DataModal';
import { ScannerModal } from './components/ScannerModal';

import { TrashBin, DisposableItem, ServiceLogEntry, CollectionRoute } from './types';
import { StorageService } from './services/storageService';
import { AluEngineService } from './services/aluEngineService';
import { soundService } from './services/soundService';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [bins, setBins] = useState<TrashBin[]>([]);
  const [disposables, setDisposables] = useState<DisposableItem[]>([]);
  const [logs, setLogs] = useState<ServiceLogEntry[]>([]);
  const [activeRoute, setActiveRoute] = useState<CollectionRoute | null>(null);

  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [selectedBinForService, setSelectedBinForService] = useState<TrashBin | null>(null);
  const [selectedBinForQR, setSelectedBinForQR] = useState<TrashBin | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(soundService.isMuted());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial Data Load
  useEffect(() => {
    async function init() {
      const loadedBins = await StorageService.loadBins();
      const loadedDisposables = await StorageService.loadDisposables();
      const loadedLogs = await StorageService.loadLogs();
      const loadedRoute = await StorageService.loadActiveRoute();

      setBins(loadedBins);
      setDisposables(loadedDisposables);
      setLogs(loadedLogs);
      setActiveRoute(loadedRoute);
      setIsLoading(false);
    }
    init();
  }, []);

  // Sync to Storage
  useEffect(() => {
    if (!isLoading) {
      StorageService.saveBins(bins);
    }
  }, [bins, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      StorageService.saveDisposables(disposables);
    }
  }, [disposables, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      StorageService.saveLogs(logs);
    }
  }, [logs, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      StorageService.saveActiveRoute(activeRoute);
    }
  }, [activeRoute, isLoading]);

  // Environmental Metrics Calculation
  const metrics = useMemo(() => {
    let landfillKg = 0;
    let recycledKg = 0;
    let compostKg = 0;
    let ewasteKg = 0;

    for (const log of logs) {
      if (log.stream === 'general') landfillKg += log.weightCollectedKg;
      else if (log.stream === 'recyclables') recycledKg += log.weightCollectedKg;
      else if (log.stream === 'compost') compostKg += log.weightCollectedKg;
      else if (log.stream === 'ewaste') ewasteKg += log.weightCollectedKg;
    }

    return AluEngineService.computeMetrics(landfillKg, recycledKg, compostKg, ewasteKg);
  }, [logs]);

  // IoT Sensor Ultrasonic Telemetry Simulator
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setBins((prev) =>
        prev.map((bin) => {
          // Add small simulated incremental fill (e.g. 1-2% randomly)
          const delta = Math.random() > 0.4 ? 1 : 0;
          if (delta === 0) return bin;

          const newFill = Math.min(100, bin.currentFillPct + delta);
          const newPriority = AluEngineService.calculateBinPriority(
            newFill,
            bin.stream,
            bin.lastEmptiedAt,
            bin.fillRatePerHour
          );
          const newOverflow = AluEngineService.calculateOverflowHours(newFill, bin.fillRatePerHour);

          let newStatus = bin.status;
          if (newFill >= 85) newStatus = 'overflowing';
          else if (newFill >= 70) newStatus = 'attention';
          else newStatus = 'normal';

          return {
            ...bin,
            currentFillPct: newFill,
            priorityScore: newPriority,
            hoursUntilOverflow: newOverflow,
            status: newStatus,
          };
        })
      );
    }, 8000); // every 8 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Handlers: Bins
  const handleAddBin = (newBinData: any) => {
    const id = `bin-${Date.now()}`;
    const numericId = 100 + bins.length + 1;
    const priority = AluEngineService.calculateBinPriority(
      newBinData.currentFillPct,
      newBinData.stream,
      newBinData.lastEmptiedAt,
      newBinData.fillRatePerHour
    );
    const overflow = AluEngineService.calculateOverflowHours(
      newBinData.currentFillPct,
      newBinData.fillRatePerHour
    );

    const newBin: TrashBin = {
      ...newBinData,
      id,
      numericId,
      priorityScore: priority,
      hoursUntilOverflow: overflow,
    };

    setBins((prev) => [newBin, ...prev]);
    soundService.playSuccessChime();
  };

  const handleUpdateBin = (updatedBin: TrashBin) => {
    const priority = AluEngineService.calculateBinPriority(
      updatedBin.currentFillPct,
      updatedBin.stream,
      updatedBin.lastEmptiedAt,
      updatedBin.fillRatePerHour
    );
    const overflow = AluEngineService.calculateOverflowHours(
      updatedBin.currentFillPct,
      updatedBin.fillRatePerHour
    );

    const recomputed = {
      ...updatedBin,
      priorityScore: priority,
      hoursUntilOverflow: overflow,
    };

    setBins((prev) => prev.map((b) => (b.id === recomputed.id ? recomputed : b)));
    soundService.playSuccessChime();
  };

  const handleDeleteBin = (id: string) => {
    setBins((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUpdateBinCoordinates = async (binId: string, mapX: number, mapY: number) => {
    setBins((prev) =>
      prev.map((b) =>
        b.id === binId
          ? {
              ...b,
              location: {
                ...b.location,
                mapX,
                mapY,
              },
            }
          : b
      )
    );
  };

  // In Your Area Map Marker Handlers
  const handleAddBinMarker = (binData: Partial<TrashBin>) => {
    const id = `bin-${Date.now()}`;
    const numericId = 100 + bins.length + 1;
    const stream = binData.stream || 'general';
    const fill = binData.currentFillPct ?? 0;
    const fillRate = binData.fillRatePerHour ?? 3.5;
    const lastEmptied = new Date().toISOString();

    const priority = AluEngineService.calculateBinPriority(fill, stream, lastEmptied, fillRate);
    const overflow = AluEngineService.calculateOverflowHours(fill, fillRate);

    const newBin: TrashBin = {
      id,
      numericId,
      code: binData.code || `BIN-AREA-${numericId}`,
      name: binData.name || `Area Trash Bin #${numericId}`,
      stream,
      location: {
        building: binData.location?.building || 'Local District',
        floor: binData.location?.floor || 'Ground Level',
        roomOrArea: binData.location?.roomOrArea || 'Outdoor Area',
        mapX: 50,
        mapY: 50,
        coordinates: binData.location?.coordinates || { lat: 37.7749, lng: -122.4194 },
      },
      capacityLiters: binData.capacityLiters || 200,
      currentFillPct: fill,
      fillRatePerHour: fillRate,
      lastEmptiedAt: lastEmptied,
      nextScheduledPickup: new Date(Date.now() + 86400000).toISOString(),
      status: fill >= 85 ? 'overflowing' : fill >= 70 ? 'attention' : 'normal',
      priorityScore: priority,
      hoursUntilOverflow: overflow,
      tags: binData.tags || ['in-your-area', 'user-marked', stream],
      notes: binData.notes || 'Added from In Your Area Map',
    };

    setBins((prev) => [newBin, ...prev]);
    soundService.playMarkerPlaced();
  };

  const handleRemoveBinMarker = (binId: string) => {
    setBins((prev) => prev.filter((b) => b.id !== binId));
    if (activeRoute) {
      setActiveRoute({
        ...activeRoute,
        stops: activeRoute.stops.filter((s) => s.binId !== binId),
      });
    }
    soundService.playMarkerRemoved();
  };

  const handleUpdateBinFill = (binId: string, newFillPct: number) => {
    setBins((prev) =>
      prev.map((b) => {
        if (b.id !== binId) return b;
        const priority = AluEngineService.calculateBinPriority(
          newFillPct,
          b.stream,
          b.lastEmptiedAt,
          b.fillRatePerHour
        );
        const overflow = AluEngineService.calculateOverflowHours(newFillPct, b.fillRatePerHour);
        const newStatus: 'normal' | 'attention' | 'overflowing' | 'maintenance' =
          newFillPct >= 85 ? 'overflowing' : newFillPct >= 70 ? 'attention' : 'normal';
        return {
          ...b,
          currentFillPct: newFillPct,
          status: newStatus,
          priorityScore: priority,
          hoursUntilOverflow: overflow,
          lastEmptiedAt: newFillPct === 0 ? new Date().toISOString() : b.lastEmptiedAt,
        };
      })
    );
  };

  // Handlers: Disposables
  const handleAddDisposable = (newItem: any) => {
    const id = `disp-${Date.now()}`;
    const numericId = 200 + disposables.length + 1;
    const daysRemaining = AluEngineService.calculateDisposableDepletion(
      newItem.currentStock,
      newItem.dailyBurnRate
    );

    const item: DisposableItem = {
      ...newItem,
      id,
      numericId,
      daysRemaining,
    };

    setDisposables((prev) => [item, ...prev]);
    soundService.playSuccessChime();
  };

  const handleUpdateStock = (id: string, delta: number, note?: string) => {
    setDisposables((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newStock = Math.max(0, item.currentStock + delta);
        const days = AluEngineService.calculateDisposableDepletion(newStock, item.dailyBurnRate);
        return {
          ...item,
          currentStock: newStock,
          daysRemaining: days,
          lastRestockedAt: delta > 0 ? new Date().toISOString() : item.lastRestockedAt,
        };
      })
    );
  };

  const handleDeleteDisposable = (id: string) => {
    setDisposables((prev) => prev.filter((d) => d.id !== id));
  };

  // Handlers: Service Log & Route
  const handleConfirmService = (logData: Omit<ServiceLogEntry, 'id' | 'timestamp'>) => {
    const newLog: ServiceLogEntry = {
      ...logData,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setLogs((prev) => [newLog, ...prev]);

    // Reset bin fill level
    setBins((prev) =>
      prev.map((b) => {
        if (b.id !== logData.binId) return b;
        return {
          ...b,
          currentFillPct: 0,
          status: 'normal',
          lastEmptiedAt: new Date().toISOString(),
          priorityScore: AluEngineService.calculateBinPriority(0, b.stream, new Date().toISOString(), b.fillRatePerHour),
          hoursUntilOverflow: AluEngineService.calculateOverflowHours(0, b.fillRatePerHour),
        };
      })
    );

    // If active route exists, mark stop serviced if matched
    if (activeRoute) {
      setActiveRoute({
        ...activeRoute,
        stops: activeRoute.stops.map((s) => (s.binId === logData.binId ? { ...s, isServiced: true } : s)),
        completedStops: activeRoute.stops.filter((s) => s.binId === logData.binId || s.isServiced).length,
      });
    }

    soundService.playSuccessChime();
    setSelectedBinForService(null);
  };

  const handleGenerateRoute = () => {
    const stops = AluEngineService.optimizeRoute(bins);
    const totalVolume = stops.reduce((acc, s) => {
      const b = bins.find((item) => item.id === s.binId);
      const cap = b ? b.capacityLiters : 200;
      return acc + Math.round((s.currentFillPct / 100) * cap);
    }, 0);

    const newRoute: CollectionRoute = {
      id: `route-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 900 + 100)}`,
      name: `Alu Dynamic Collection Manifest (${new Date().toLocaleTimeString()})`,
      generatedAt: new Date().toISOString(),
      stops,
      totalBins: stops.length,
      completedStops: 0,
      estimatedMinutes: Math.max(15, stops.length * 6),
      totalVolumeToCollectLiters: totalVolume,
      status: 'pending',
    };

    setActiveRoute(newRoute);
    soundService.playScanBeep();
    setActiveTab('routes');
  };

  const handleToggleStopServiced = (stopOrder: number) => {
    if (!activeRoute) return;
    const updatedStops = activeRoute.stops.map((stop) => {
      if (stop.stopOrder === stopOrder) {
        const nextState = !stop.isServiced;
        // Also zero out bin fill if marked serviced
        if (nextState) {
          setBins((prev) =>
            prev.map((b) => (b.id === stop.binId ? { ...b, currentFillPct: 0, status: 'normal', lastEmptiedAt: new Date().toISOString() } : b))
          );
        }
        return {
          ...stop,
          isServiced: nextState,
          servicedAt: nextState ? new Date().toISOString() : undefined,
        };
      }
      return stop;
    });

    const completed = updatedStops.filter((s) => s.isServiced).length;
    setActiveRoute({
      ...activeRoute,
      stops: updatedStops,
      completedStops: completed,
      status: completed === updatedStops.length ? 'completed' : 'in_progress',
    });
  };

  const handleCompleteRoute = () => {
    setActiveRoute(null);
  };

  const handleForceAluCheck = () => {
    setBins((prev) =>
      prev.map((b) => ({
        ...b,
        priorityScore: AluEngineService.calculateBinPriority(b.currentFillPct, b.stream, b.lastEmptiedAt, b.fillRatePerHour),
        hoursUntilOverflow: AluEngineService.calculateOverflowHours(b.currentFillPct, b.fillRatePerHour),
      }))
    );
    soundService.playSuccessChime();
  };

  const handleDataReset = async () => {
    const loadedBins = await StorageService.loadBins();
    const loadedDisposables = await StorageService.loadDisposables();
    const loadedLogs = await StorageService.loadLogs();
    setBins(loadedBins);
    setDisposables(loadedDisposables);
    setLogs(loadedLogs);
    setActiveRoute(null);
  };

  const handleToggleSound = () => {
    const muted = soundService.toggleMute();
    setIsSoundMuted(muted);
    if (!muted) {
      soundService.playScanBeep();
    }
  };

  const overflowingCount = bins.filter((b) => b.currentFillPct >= 85).length;
  const lowStockCount = disposables.filter((d) => d.currentStock <= d.restockThreshold).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white font-mono text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Booting THa Trash App & Alu Engine v2.0...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <InstallAppBanner />
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overflowingCount={overflowingCount}
        lowStockCount={lowStockCount}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onTriggerAluCheck={handleForceAluCheck}
        onQuickMarkBin={() => setActiveTab('map')}
        isSoundMuted={isSoundMuted}
        onToggleSound={handleToggleSound}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            bins={bins}
            disposables={disposables}
            logs={logs}
            metrics={metrics}
            onNavigateTab={setActiveTab}
            onServiceBin={(b) => setSelectedBinForService(b)}
            onRunRoute={handleGenerateRoute}
            onQuickMarkBin={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'bins' && (
          <BinManagementView
            bins={bins}
            onAddBin={handleAddBin}
            onUpdateBin={handleUpdateBin}
            onDeleteBin={handleDeleteBin}
            onOpenServiceModal={(b) => setSelectedBinForService(b)}
            onOpenQRModal={(b) => setSelectedBinForQR(b)}
          />
        )}

        {activeTab === 'disposables' && (
          <DisposablesView
            items={disposables}
            onAddItem={handleAddDisposable}
            onUpdateStock={handleUpdateStock}
            onDeleteItem={handleDeleteDisposable}
          />
        )}

        {activeTab === 'routes' && (
          <RouteOptimizerView
            route={activeRoute}
            onGenerateRoute={handleGenerateRoute}
            onToggleStopServiced={handleToggleStopServiced}
            onCompleteRoute={handleCompleteRoute}
            onNavigateToMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'map' && (
          <AreaMapView
            bins={bins}
            activeRoute={activeRoute}
            onAddBinMarker={handleAddBinMarker}
            onRemoveBinMarker={handleRemoveBinMarker}
            onServiceBin={(b) => setSelectedBinForService(b)}
            onUpdateBinFill={handleUpdateBinFill}
            onNavigateToRoute={() => setActiveTab('routes')}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView metrics={metrics} logs={logs} />}
      </main>

      {/* Modals */}
      {selectedBinForService && (
        <ServiceModal
          bin={selectedBinForService}
          onClose={() => setSelectedBinForService(null)}
          onConfirmService={handleConfirmService}
        />
      )}

      {selectedBinForQR && (
        <QRTagModal bin={selectedBinForQR} onClose={() => setSelectedBinForQR(null)} />
      )}

      {isDataModalOpen && (
        <DataModal onClose={() => setIsDataModalOpen(false)} onDataReset={handleDataReset} />
      )}

      {isScannerOpen && (
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          bins={bins}
          disposables={disposables}
          onScanBin={(bin) => setSelectedBinForService(bin)}
          onScanDisposable={() => setActiveTab('disposables')}
        />
      )}
    </div>
  );
};
