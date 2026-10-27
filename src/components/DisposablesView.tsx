// ==============================================================================
// THa Trash App - Disposables & Consumables Tracking (DisposablesView.tsx)
// ==============================================================================

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  Leaf,
  Layers,
  Sparkles,
  TrendingDown,
  Info,
  Calendar,
} from 'lucide-react';
import { DisposableItem, DisposableCategory, WasteStreamType } from '../types';

interface DisposablesViewProps {
  items: DisposableItem[];
  onAddItem: (item: Omit<DisposableItem, 'id' | 'numericId' | 'daysRemaining'>) => void;
  onUpdateStock: (id: string, delta: number, note?: string) => void;
  onDeleteItem: (id: string) => void;
}

export const DisposablesView: React.FC<DisposablesViewProps> = ({
  items,
  onAddItem,
  onUpdateStock,
  onDeleteItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemForUsage, setSelectedItemForUsage] = useState<DisposableItem | null>(null);
  const [usageAmount, setUsageAmount] = useState<number>(10);
  const [isRestockMode, setIsRestockMode] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'biodegradable' as DisposableCategory,
    currentStock: 500,
    unit: 'units',
    restockThreshold: 200,
    dailyBurnRate: 25,
    costPerUnit: 0.25,
    carbonFootprintGrams: 20,
    disposalGuidance: '',
    targetWasteStream: 'compost' as WasteStreamType,
    supplier: '',
  });

  const handleOpenAdd = () => {
    setFormData({
      sku: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'biodegradable',
      currentStock: 500,
      unit: 'units',
      restockThreshold: 200,
      dailyBurnRate: 25,
      costPerUnit: 0.25,
      carbonFootprintGrams: 20,
      disposalGuidance: 'Place in green compost bin when disposing.',
      targetWasteStream: 'compost',
      supplier: 'EcoSupply Logistics',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenUsageModal = (item: DisposableItem, restock = false) => {
    setSelectedItemForUsage(item);
    setIsRestockMode(restock);
    setUsageAmount(restock ? 100 : Math.min(25, item.currentStock));
  };

  const handleConfirmStockChange = () => {
    if (!selectedItemForUsage || usageAmount <= 0) return;
    const delta = isRestockMode ? usageAmount : -usageAmount;
    onUpdateStock(selectedItemForUsage.id, delta);
    setSelectedItemForUsage(null);
  };

  const handleSubmitNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;

    onAddItem({
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      categoryAluCode:
        formData.category === 'biodegradable'
          ? 1
          : formData.category === 'single_use_plastic'
          ? 2
          : formData.category === 'paper'
          ? 3
          : formData.category === 'sanitary_medical'
          ? 4
          : 5,
      currentStock: Number(formData.currentStock),
      unit: formData.unit,
      restockThreshold: Number(formData.restockThreshold),
      dailyBurnRate: Number(formData.dailyBurnRate),
      costPerUnit: Number(formData.costPerUnit),
      carbonFootprintGrams: Number(formData.carbonFootprintGrams),
      disposalGuidance: formData.disposalGuidance,
      targetWasteStream: formData.targetWasteStream,
      supplier: formData.supplier || undefined,
    });

    setIsAddModalOpen(false);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Package className="w-6 h-6 text-emerald-400" />
            <span>Disposables & Consumables Lifecycle</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track stock levels, daily depletion rates, and downstream waste stream diversion
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 flex items-center space-x-2 self-start md:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Catalog New Disposable</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by disposable item name, SKU, or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full md:w-56 px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Material Categories</option>
          <option value="biodegradable">Biodegradable / Compostable</option>
          <option value="single_use_plastic">Single-Use Plastics</option>
          <option value="paper">Paper & Cardboard</option>
          <option value="sanitary_medical">Sanitary & Medical</option>
          <option value="metal_foil">Aluminum & Metal Foil</option>
        </select>
      </div>

      {/* Disposables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isLowStock = item.currentStock <= item.restockThreshold;
          const isCritical = item.daysRemaining <= 3;

          const categoryLabels: Record<DisposableCategory, { label: string; color: string; border: string }> = {
            biodegradable: { label: 'Compostable', color: 'text-emerald-400 bg-emerald-950/60', border: 'border-emerald-500/40' },
            single_use_plastic: { label: 'Plastic', color: 'text-amber-400 bg-amber-950/60', border: 'border-amber-500/40' },
            paper: { label: 'Paper', color: 'text-blue-400 bg-blue-950/60', border: 'border-blue-500/40' },
            sanitary_medical: { label: 'Medical/Sanitary', color: 'text-rose-400 bg-rose-950/60', border: 'border-rose-500/40' },
            metal_foil: { label: 'Metal/Foil', color: 'text-purple-400 bg-purple-950/60', border: 'border-purple-500/40' },
          };

          const cat = categoryLabels[item.category] || categoryLabels.biodegradable;

          return (
            <div
              key={item.id}
              className={`bg-slate-900/60 border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl ${
                isLowStock
                  ? 'border-amber-500/50 shadow-md shadow-amber-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${cat.color} border ${cat.border}`}
                  >
                    {cat.label}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{item.sku}</span>
                </div>

                <h3 className="font-bold text-sm text-white">{item.name}</h3>
                {item.supplier && (
                  <p className="text-[11px] text-slate-400 mt-0.5">Supplier: {item.supplier}</p>
                )}

                {/* Stock Gauge */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-mono text-[11px]">Current Stock</span>
                    <span className={`font-black font-mono ${isLowStock ? 'text-amber-400' : 'text-white'}`}>
                      {item.currentStock.toLocaleString()} {item.unit}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isLowStock
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{
                        width: `${Math.min(100, (item.currentStock / (item.restockThreshold * 2.5)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>Reorder at: {item.restockThreshold}</span>
                    <span>Rate: {item.dailyBurnRate}/day</span>
                  </div>
                </div>

                {/* Alu Engine Prediction */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block">Exhaustion:</span>
                    <span className={`font-bold ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ~{item.daysRemaining} days remaining
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Carbon Rating:</span>
                    <span className="text-slate-300 font-bold">{item.carbonFootprintGrams}g CO₂e / unit</span>
                  </div>
                </div>

                {/* Disposal Guidance Badge */}
                <div className="mt-3 p-2 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-300 flex items-start space-x-2">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{item.disposalGuidance}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="text-xs text-slate-500 hover:text-rose-400 transition-all"
                >
                  Remove
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenUsageModal(item, false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1"
                  >
                    <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Log Used</span>
                  </button>

                  <button
                    onClick={() => handleOpenUsageModal(item, true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restock</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjust Stock Modal */}
      {selectedItemForUsage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {isRestockMode ? 'Restock Disposable Inventory' : 'Log Consumed / Disposed Units'}
            </h3>
            <p className="text-xs text-slate-400">
              {selectedItemForUsage.name} ({selectedItemForUsage.sku})
            </p>

            <div className="space-y-3">
              <label className="block text-xs text-slate-400">
                Quantity to {isRestockMode ? 'Add' : 'Deduct'} ({selectedItemForUsage.unit})
              </label>
              <input
                type="number"
                min="1"
                max={isRestockMode ? 50000 : selectedItemForUsage.currentStock}
                value={usageAmount}
                onChange={(e) => setUsageAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400">
                New Stock Total:{' '}
                <strong className="text-white font-mono">
                  {isRestockMode
                    ? selectedItemForUsage.currentStock + usageAmount
                    : Math.max(0, selectedItemForUsage.currentStock - usageAmount)}{' '}
                  {selectedItemForUsage.unit}
                </strong>
              </div>
            </div>

            <div className="pt-3 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedItemForUsage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStockChange}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs shadow-md"
              >
                Confirm Inventory Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Register New Disposable Item</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Material Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as DisposableCategory })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="biodegradable">Biodegradable / Compostable</option>
                    <option value="single_use_plastic">Single-Use Plastic</option>
                    <option value="paper">Paper / Cardboard</option>
                    <option value="sanitary_medical">Sanitary / Medical</option>
                    <option value="metal_foil">Aluminum / Metal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., PLA Cold Cups 16oz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. units, rolls"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Daily Burn Rate</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.dailyBurnRate}
                    onChange={(e) => setFormData({ ...formData, dailyBurnRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Restock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.restockThreshold}
                    onChange={(e) => setFormData({ ...formData, restockThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Carbon Footprint (g CO₂e)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.carbonFootprintGrams}
                    onChange={(e) => setFormData({ ...formData, carbonFootprintGrams: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Disposal Guidance Instructions</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Deposit in green organics bin only."
                  value={formData.disposalGuidance}
                  onChange={(e) => setFormData({ ...formData, disposalGuidance: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md"
                >
                  Catalog Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
