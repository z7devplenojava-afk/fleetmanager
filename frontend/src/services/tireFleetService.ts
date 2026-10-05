import api from './api';

export interface TireItem {
  id: string;
  serialNumber: string; // DOT / Fogo
  brand: string;
  model: string;
  size: string;
  status: 'AVAILABLE' | 'IN_USE' | 'RECAP' | 'SCRAPPED';
  currentMileage: number;
  recapCount: number;
  vehicleId?: string;
  axleNumber?: number;
  positionIndex?: number;
  dot?: string;
  initialTreadDepth?: number;
  currentTreadDepth?: number;
  acquisitionCost?: number;
  totalRepairCost?: number;
  cpk?: number;
  installKm?: number;
  installDate?: string;
}

export interface MountedPosition {
  positionCode: string; // DE, DD, TIE, TOE, TID, TOD, ESTEPE
  axleNumber: number;
  positionIndex: number;
  positionName: string;
  tire: TireItem | null;
}

export interface VehicleTireChassis {
  vehicleId: string;
  plate: string;
  model: string;
  chassiType: string;
  currentKm: number;
  positions: MountedPosition[];
}

export interface TireMountPayload {
  tireId: string;
  vehicleId: string;
  axleNumber: number;
  positionIndex: number;
  positionCode: string;
  currentVehicleKm: number;
  treadDepthMm?: number;
  notes?: string;
}

export interface TireDismountPayload {
  tireId: string;
  currentVehicleKm: number;
  treadDepthMm?: number;
  removalReason: 'ESTOQUE' | 'ENVIAR_REFORMA' | 'DESCARTE_SUCATA' | string;
  targetLocationId?: string;
  notes?: string;
}

export interface TireMovementHistory {
  id: string;
  tireId: string;
  vehicleId?: string;
  type: string;
  axleNumber?: number;
  positionIndex?: number;
  mileage: number;
  notes?: string;
  movementDate: string;
}

export const tireFleetService = {
  getAll: async (): Promise<TireItem[]> => {
    const response = await api.get('/api/tires');
    return response.data;
  },

  getAvailable: async (): Promise<TireItem[]> => {
    const response = await api.get('/api/tires/available');
    return response.data;
  },

  getVehicleChassis: async (vehicleId: string): Promise<VehicleTireChassis> => {
    const response = await api.get(`/api/tires/chassis/${vehicleId}`);
    return response.data;
  },

  mountTire: async (payload: TireMountPayload): Promise<TireItem> => {
    const response = await api.post('/api/tires/mount', payload);
    return response.data;
  },

  dismountTire: async (payload: TireDismountPayload): Promise<TireItem> => {
    const response = await api.post('/api/tires/dismount', payload);
    return response.data;
  },

  getHistory: async (tireId: string): Promise<TireMovementHistory[]> => {
    const response = await api.get(`/api/tires/${tireId}/history`);
    return response.data;
  }
};

export default tireFleetService;
