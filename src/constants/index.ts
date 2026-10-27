// ==============================================================================
// THa Trash App - Constants & Waste Stream Metadata (src/constants/index.ts)
// ==============================================================================

import { WasteStreamType, WasteStreamInfo } from '../types';

export const STREAM_INFO: Record<WasteStreamType, WasteStreamInfo> = {
  general: {
    id: 'general',
    aluCode: 1,
    label: 'Landfill / General',
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.1)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    iconName: 'trash',
    hazardWeight: 1,
  },
  recyclables: {
    id: 'recyclables',
    aluCode: 2,
    label: 'Mixed Recyclables',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    iconName: 'recycle',
    hazardWeight: 2,
  },
  compost: {
    id: 'compost',
    aluCode: 3,
    label: 'Organics & Compost',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    iconName: 'leaf',
    hazardWeight: 3,
  },
  hazardous: {
    id: 'hazardous',
    aluCode: 4,
    label: 'Hazardous & Bio-Waste',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    iconName: 'alert-triangle',
    hazardWeight: 10,
  },
  ewaste: {
    id: 'ewaste',
    aluCode: 5,
    label: 'E-Waste & Batteries',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    iconName: 'cpu',
    hazardWeight: 5,
  },
};
