import api from '@/lib/axios';

export interface GarageVehicleSummary {
  id: string;
  plate: string;
  model?: string;
  brand?: string;
  currentMileage?: number;
  status?: string;
  assignedDriver?: string;
  clientName?: string;
  vehicleType?: string;
  entryDate?: string;
  entryTime?: string;
  stayDurationMinutes?: number;
  stayDurationFormatted?: string;
  reason?: string;
}

export interface GarageOccupancyDashboard {
  garages: Garage[];
  totalGarages: number;
  totalVehicles: number;
  totalCapacity: number;
  overallOccupancy?: number | null;
  garagesWithCapacity: number;
  fullGarages: number;
  nearCapacityGarages: number;
  fleetStatusTotals?: Record<string, number>;
}

export interface Garage {
  id: string;
  name: string;
  address?: string;
  responsibleEmployeeId?: string;
  responsibleName?: string;
  responsiblePhone?: string;
  capacity?: number;
  notes?: string;
  companyId?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  vehicleCount?: number;
  occupancyRate?: number | null;
  atCapacity?: boolean;
  nearCapacity?: boolean;
  statusBreakdown?: Record<string, number>;
  vehicles?: GarageVehicleSummary[];
}

export interface GarageInput {
  name: string;
  address?: string;
  responsibleEmployeeId?: string;
  responsibleName?: string;
  responsiblePhone?: string;
  capacity?: number;
  notes?: string;
  active?: boolean;
}

export interface GarageMovement {
  id: string;
  vehicleId: string;
  vehiclePlate?: string;
  fromGarageId?: string;
  fromGarageName?: string;
  toGarageId?: string;
  toGarageName?: string;
  movementType?: 'CHECK_IN' | 'CHECK_OUT' | 'TRANSFER' | string;
  driverName?: string;
  clientName?: string;
  entryTime?: string;
  exitTime?: string;
  stayDurationMinutes?: number;
  stayDurationFormatted?: string;
  activeStay?: boolean;
  reason?: string;
  reasonDetail?: string;
  performedBy?: string;
  performedByName?: string;
  kmReading?: number;
  companyId?: string;
  createdAt?: string;
}

export interface GarageTransferInput {
  vehicleId: string;
  toGarageId: string;
  reason?: string;
  reasonDetail?: string;
  kmReading?: number;
}

export interface GarageCheckInInput {
  vehicleId: string;
  garageId: string;
  driverName?: string;
  clientName?: string;
  reason?: string;
  reasonDetail?: string;
  kmReading?: number;
  entryTime?: string;
}

export interface GarageCheckOutInput {
  vehicleId: string;
  driverName?: string;
  reason?: string;
  reasonDetail?: string;
  kmReading?: number;
  exitTime?: string;
}

export const MOVEMENT_REASON_LABELS: Record<string, string> = {
  CHECK_IN: 'Entrada no Pátio',
  CHECK_OUT: 'Saída do Pátio',
  REMANEJAMENTO: 'Remanejamento entre Garagens',
  MANUTENCAO: 'Manutenção / Reparo',
  LIMPEZA: 'Limpeza / Higienização',
  OPERACAO: 'Operação / Linha',
  ESCALA: 'Escala de Viagem',
  RECOLHIMENTO: 'Recolhimento Noturno / Final de Turno',
  RESERVA: 'Reserva Técnica Operacional',
  OUTROS: 'Outros',
};

class GarageService {
  async list(): Promise<Garage[]> {
    const response = await api.get('/garages');
    return response.data;
  }

  /** Dashboard de ocupação com alertas de lotação. */
  async occupancyDashboard(): Promise<GarageOccupancyDashboard> {
    const response = await api.get('/garages/dashboard');
    return response.data;
  }

  async getById(id: string): Promise<Garage> {
    const response = await api.get(`/garages/${id}`);
    return response.data;
  }

  async create(data: GarageInput): Promise<Garage> {
    const response = await api.post('/garages', data);
    return response.data;
  }

  async update(id: string, data: Partial<GarageInput>): Promise<Garage> {
    const response = await api.put(`/garages/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/garages/${id}`);
  }

  async getVehicles(id: string): Promise<Garage> {
    const response = await api.get(`/garages/${id}/vehicles`);
    return response.data;
  }

  async assignVehicle(garageId: string, vehicleId: string): Promise<Garage> {
    const response = await api.post(`/garages/${garageId}/vehicles/${vehicleId}`);
    return response.data;
  }

  async unassignVehicle(garageId: string, vehicleId: string): Promise<Garage> {
    const response = await api.delete(`/garages/${garageId}/vehicles/${vehicleId}`);
    return response.data;
  }

  async getVehicleGarage(vehicleId: string): Promise<Garage | null> {
    const response = await api.get(`/garages/vehicle/${vehicleId}`);
    return response.data;
  }

  /** Remanejamento de veículo entre garagens. */
  async transferVehicle(data: GarageTransferInput): Promise<GarageMovement> {
    const response = await api.post('/garages/transfers', data);
    return response.data;
  }

  /** Check-in rápido de entrada no pátio. */
  async checkIn(data: GarageCheckInInput): Promise<GarageMovement> {
    const response = await api.post('/garages/check-in', data);
    return response.data;
  }

  /** Check-out rápido de saída do pátio. */
  async checkOut(data: GarageCheckOutInput): Promise<GarageMovement> {
    const response = await api.post('/garages/check-out', data);
    return response.data;
  }

  /** Lista de veículos atualmente dentro dos pátios com tempo de permanência live. */
  async listActiveStays(): Promise<GarageMovement[]> {
    const response = await api.get('/garages/active-stays');
    return response.data;
  }

  /** Histórico de movimentações entre garagens (paginado). */
  async listMovements(page = 0, size = 50): Promise<GarageMovement[]> {
    const response = await api.get(`/garages/movements?page=${page}&size=${size}`);
    return response.data;
  }

  /** Histórico de movimentações de um veículo. */
  async getVehicleMovements(vehicleId: string): Promise<GarageMovement[]> {
    const response = await api.get(`/garages/movements/vehicle/${vehicleId}`);
    return response.data;
  }

  /** Executa o seed de garagens e alocação de veículos de demonstração. */
  async seed(): Promise<string> {
    const response = await api.post('/garages/seed');
    return response.data;
  }
}

export const garageService = new GarageService();
export default garageService;
