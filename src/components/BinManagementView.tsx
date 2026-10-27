// ==============================================================================
// THa Trash App - Bin Management (BinManagementView.tsx)
// ==============================================================================

import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Search,
  Filter,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  Edit2,
  Trash,
  Battery,
  SlidersHorizontal,
} from 'lucide-react';
import { TrashBin, WasteStreamType } from '../types';

interface BinManagementViewProps {
  bins: TrashBin[];
  onAddBin: (bin: Omit<TrashBin, 'id' | 'numericId' | 'priorityScore' | 'hoursUntilOverflow'>) => void;
  onUpdateBin: (bin: TrashBin) => void;
  onDeleteBin: (id: string) => void;
  onOpenServiceModal: (bin: TrashBin) => void;
  onOpenQRModal: (bin: TrashBin) => void;
}

export const BinManagementView: React.FC<BinManagementViewProps> = ({
  bins,
  onAddBin,
  onUpdateBin,
  onDeleteBin,
  onOpenServiceModal,
  onOpenQRModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<TrashBin | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    stream: 'general' as WasteStreamType,
    capacityLiters: 240,
    currentFillPct: 0,
    fillRatePerHour: 3,
    building: '',
    floor: '',
    roomOrArea: '',
    sensorId: '',
  });

  const handleOpenAdd = () => {
    setEditingBin(null);
    setFormData({
      code: `BIN-GEN-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      stream: 'general',
      capacityLiters: 240,
      currentFillPct: 15,
      fillRatePerHour: 3,
      building: 'Main Hall',
      floor: '1st Floor',
      roomOrArea: 'Corridor',
      sensorId: `IOT-US-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (bin: TrashBin) => {
    setEditingBin(bin);
    setFormData({
      code: bin.code,
      name: bin.name,
      stream: bin.stream,
      capacityLiters: bin.capacityLiters,
      currentFillPct: bin.currentFillPct,
      fillRatePerHour: bin.fillRatePerHour,
      building: bin.location.building,
      floor: bin.location.floor,
      roomOrArea: bin.location.roomOrArea,
      sensorId: bin.sensorId || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;

    if (editingBin) {
      onUpdateBin({
        ...editingBin,
        code: formData.code,
        name: formData.name,
        stream: formData.stream,
        capacityLiters: Number(formData.capacityLiters),
        currentFillPct: Number(formData.currentFillPct),
        fillRatePerHour: Number(formData.fillRatePerHour),
        location: {
          building: formData.building,
          floor: formData.floor,
          roomOrArea: formData.roomOrArea,
        },
        sensorId: formData.sensorId || undefined,
      });
    } else {
      onAddBin({
        code: formData.code,
        name: formData.name,
        stream: formData.stream,
        capacityLiters: Number(formData.capacityLiters),
        currentFillPct: Number(formData.currentFillPct),
        fillRatePerHour: Number(formData.fillRatePerHour),
        lastEmptiedAt: new Date().toISOString(),
        nextScheduledPickup: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        location: {
          building: formData.building,
          floor: formData.floor,
          roomOrArea: formData.roomOrArea,
        },
        sensorId: formData.sensorId || undefined,
        sensorBatteryPct: 98,
        status: Number(formData.currentFillPct) >= 85 ? 'overflowing' : 'normal',
        tags: [formData.stream],
      });
    }

    setIsAddModalOpen(false);
  };

  const filteredBins = bins.filter((bin) => {
    const matchesSearch =
      bin.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.location.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.location.roomOrArea.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStream = selectedStream === 'all' || bin.stream === selectedStream;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'critical' && bin.currentFillPct >= 85) ||
      (selectedStatus === 'attention' && bin.currentFillPct >= 70 && bin.currentFillPct < 85) ||
      (selectedStatus === 'normal' && bin.currentFillPct < 70);

    return matchesSearch && matchesStream && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Trash2 className="w-6 h-6 text-emerald-400" />
            <span>Waste Bin Fleet Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking {bins.length} sensor-monitored receptacles with automated Alu priority routing
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 flex items-center space-x-2 self-start md:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy New Receptacle</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by bin code, name, building, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Stream Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Waste Streams</option>
            <option value="general">General (Landfill)</option>
            <option value="recyclables">Recyclables</option>
            <option value="compost">Compost / Organics</option>
            <option value="hazardous">Hazardous / Bio</option>
            <option value="ewaste">E-Waste</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-40 px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Fill Statuses</option>
            <option value="critical">Critical (≥85%)</option>
            <option value="attention">Attention (70-84%)</option>
            <option value="normal">Normal (&lt;70%)</option>
          </select>
        </div>
      </div>

      {/* Bins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBins.map((bin) => {
          const isOver = bin.currentFillPct >= 85;
          const isWarn = bin.currentFillPct >= 70 && !isOver;

          const streamColors: Record<WasteStreamType, { bg: string; text: string; border: string; label: string }> = {
            general: { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', label: 'Landfill' },
            recyclables: { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-500/30', label: 'Recycling' },
            compost: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-500/30', label: 'Compost' },
            hazardous: { bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-500/30', label: 'Hazardous' },
            ewaste: { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-500/30', label: 'E-Waste' },
          };

          const sBadge = streamColors[bin.stream] || streamColors['general'];

          return (
            <div
              key={bin.id}
              className={`bg-slate-900/60 border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl ${
                isOver
                  ? 'border-rose-500/60 shadow-lg shadow-rose-950/20'
                  : isWarn
                  ? 'border-amber-500/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top Row: Stream Badge & Sensor Battery */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${sBadge.bg} ${sBadge.text} border ${sBadge.border}`}
                  >
                    {sBadge.label}
                  </span>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                    {bin.sensorId && (
                      <span className="flex items-center text-slate-400">
                        <Radio className="w-3 h-3 text-emerald-400 mr-1 animate-pulse" />
                        {bin.sensorId}
                      </span>
                    )}
                    {bin.sensorBatteryPct !== undefined && (
                      <span className="flex items-center text-slate-400">
                        <Battery className="w-3 h-3 text-emerald-400 mr-0.5" />
                        {bin.sensorBatteryPct}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Bin Name & Code */}
                <h3 className="font-bold text-sm text-white">{bin.code}</h3>
                <p className="text-xs text-slate-300 font-medium mb-1">{bin.name}</p>
                <p className="text-[11px] text-slate-500">
                  {bin.location.building} • {bin.location.floor} ({bin.location.roomOrArea})
                </p>

                {/* Fill Gauge */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-mono text-[11px]">Fill Level</span>
                    <span
                      className={`font-black font-mono text-sm ${
                        isOver ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {bin.currentFillPct}% ({Math.round((bin.capacityLiters * bin.currentFillPct) / 100)} / {bin.capacityLiters}L)
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-rose-500'
                          : isWarn
                          ? 'bg-gradient-to-r from-amber-500 to-rose-400'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${Math.min(100, bin.currentFillPct)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Alu Engine Prediction Row */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block">Alu Priority:</span>
                    <span className="text-amber-400 font-bold">{bin.priorityScore} pts</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Overflow In:</span>
                    <span className={`font-bold ${isOver ? 'text-rose-400' : 'text-slate-200'}`}>
                      {bin.hoursUntilOverflow} hours
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onOpenQRModal(bin)}
                    title="Print QR / Barcode Tag"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(bin)}
                    title="Edit Bin Configuration"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteBin(bin.id)}
                    title="Delete Receptacle"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => onOpenServiceModal(bin)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-md transition-all flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Log Empty</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Bin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingBin ? 'Edit Receptacle Settings' : 'Deploy New Waste Receptacle'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Receptacle Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Waste Stream</label>
                  <select
                    value={formData.stream}
                    onChange={(e) => setFormData({ ...formData, stream: e.target.value as WasteStreamType })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="general">General (Landfill)</option>
                    <option value="recyclables">Recyclables</option>
                    <option value="compost">Compost / Organics</option>
                    <option value="hazardous">Hazardous / Bio</option>
                    <option value="ewaste">E-Waste</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Receptacle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Cafeteria Food Scraps North"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Building</label>
                  <input
                    type="text"
                    required
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Floor</label>
                  <input
                    type="text"
                    required
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Area / Room</label>
                  <input
                    type="text"
                    required
                    value={formData.roomOrArea}
                    onChange={(e) => setFormData({ ...formData, roomOrArea: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Capacity (Liters)</label>
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    required
                    value={formData.capacityLiters}
                    onChange={(e) => setFormData({ ...formData, capacityLiters: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Current Fill (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.currentFillPct}
                    onChange={(e) => setFormData({ ...formData, currentFillPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Fill Rate (%/hr)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formData.fillRatePerHour}
                    onChange={(e) => setFormData({ ...formData, fillRatePerHour: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">IoT Ultrasonic Sensor ID</label>
                <input
                  type="text"
                  placeholder="e.g., IOT-US-8820 (optional)"
                  value={formData.sensorId}
                  onChange={(e) => setFormData({ ...formData, sensorId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
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
                  {editingBin ? 'Save Changes' : 'Confirm Deployment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
