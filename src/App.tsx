// ==============================================================================
// THa Trash App - Main Application Shell (App.tsx)
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Header, NavTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { BinManagementView } from './components/BinManagementView';
import { DisposablesView } from './components/DisposablesView';
import { RouteOptimizerView } from './components/RouteOptimizerView';
import { AnalyticsView } from './components/AnalyticsView';
import { ServiceModal } from './components/ServiceModal';
import { QRTagModal } from './components/QRTagModal';
import { DataModal } from './components/DataModal';

import { TrashBin, DisposableItem, ServiceLogEntry, CollectionRoute } from './types';
import { StorageService } from './services/storageService';
import { AluEngineService } from './services/aluEngineService';

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
    const overflow = AluEngineService.calculateOverflowHours(newBinData.currentFillPct, newBinData.fillRatePerHour);

    const completeBin: TrashBin = {
      ...newBinData,
      id,
      numericId,
      priorityScore: priority,
      hoursUntilOverflow: overflow,
    };

    setBins((prev) => [...prev, completeBin]);
  };

  const handleUpdateBin = (updatedBin: TrashBin) => {
    setBins((prev) => prev.map((b) => (b.id === updatedBin.id ? updatedBin : b)));
  };

  const handleDeleteBin = (id: string) => {
    setBins((prev) => prev.filter((b) => b.id !== id));
  };

  // Handlers: Disposables
  const handleAddDisposable = (newItemData: any) => {
    const id = `disp-${Date.now()}`;
    const numericId = 200 + disposables.length + 1;
    const daysRemaining = AluEngineService.calculateDisposableDepletion(
      newItemData.currentStock,
      newItemData.dailyBurnRate
    );

    const completeItem: DisposableItem = {
      ...newItemData,
      id,
      numericId,
      daysRemaining,
    };

    setDisposables((prev) => [...prev, completeItem]);
  };

  const handleUpdateStock = (id: string, delta: number) => {
    setDisposables((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStock = Math.max(0, item.currentStock + delta);
          const days = AluEngineService.calculateDisposableDepletion(newStock, item.dailyBurnRate);
          return {
            ...item,
            currentStock: newStock,
            daysRemaining: days,
          };
        }
        return item;
      })
    );
  };

  const handleDeleteDisposable = (id: string) => {
    setDisposables((prev) => prev.filter((d) => d.id !== id));
  };

  // Service / Empty Action
  const handleConfirmService = (logData: any) => {
    const newLog: ServiceLogEntry = {
      ...logData,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setLogs((prev) => [newLog, ...prev]);

    // Reset the bin to 0% fill
    setBins((prev) =>
      prev.map((b) => {
        if (b.id === logData.binId) {
          return {
            ...b,
            currentFillPct: 0,
            status: 'normal',
            lastEmptiedAt: new Date().toISOString(),
            priorityScore: AluEngineService.calculateBinPriority(0, b.stream, new Date().toISOString(), b.fillRatePerHour),
            hoursUntilOverflow: AluEngineService.calculateOverflowHours(0, b.fillRatePerHour),
          };
        }
        return b;
      })
    );

    // Also mark in active route if present
    if (activeRoute) {
      setActiveRoute({
        ...activeRoute,
        stops: activeRoute.stops.map((s) => (s.binId === logData.binId ? { ...s, isServiced: true } : s)),
      });
    }
  };

  // Route Generation
  const handleGenerateRoute = () => {
    const stops = AluEngineService.optimizeRoute(bins);
    const totalVolume = stops.reduce((sum, s) => {
      const b = bins.find((x) => x.id === s.binId);
      return sum + (b ? Math.round((b.capacityLiters * b.currentFillPct) / 100) : 0);
    }, 0);

    const newRoute: CollectionRoute = {
      id: `ROUTE-${Date.now().toString().slice(-6)}`,
      name: `Alu Campus Collection Run (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      generatedAt: new Date().toISOString(),
      stops,
      totalBins: stops.length,
      completedStops: 0,
      estimatedMinutes: Math.round(stops.length * 5.5),
      totalVolumeToCollectLiters: totalVolume,
      status: 'pending',
    };

    setActiveRoute(newRoute);
    setActiveTab('routes');
  };

  const handleToggleStopServiced = (stopOrder: number) => {
    if (!activeRoute) return;
    const targetStop = activeRoute.stops.find((s) => s.stopOrder === stopOrder);
    if (!targetStop) return;

    const nextServiced = !targetStop.isServiced;

    setActiveRoute({
      ...activeRoute,
      stops: activeRoute.stops.map((s) =>
        s.stopOrder === stopOrder
          ? {
              ...s,
              isServiced: nextServiced,
              servicedAt: nextServiced ? new Date().toISOString() : undefined,
            }
          : s
      ),
    });

    // If marked as serviced, empty bin
    if (nextServiced) {
      const binToEmpty = bins.find((b) => b.id === targetStop.binId);
      if (binToEmpty) {
        handleConfirmService({
          binId: binToEmpty.id,
          binCode: binToEmpty.code,
          stream: binToEmpty.stream,
          weightCollectedKg: Math.max(5, Math.round(((binToEmpty.capacityLiters * binToEmpty.currentFillPct) / 100) * 0.22)),
          volumeCollectedLiters: Math.round((binToEmpty.capacityLiters * binToEmpty.currentFillPct) / 100),
          technician: 'Field Collector',
          hadContamination: false,
        });
      }
    }
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

  const overflowingCount = bins.filter((b) => b.currentFillPct >= 85).length;
  const lowStockCount = disposables.filter((d) => d.currentStock <= d.restockThreshold).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white font-mono text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Booting THa Trash App & Alu Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overflowingCount={overflowingCount}
        lowStockCount={lowStockCount}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onTriggerAluCheck={handleForceAluCheck}
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
    </div>
  );
};
