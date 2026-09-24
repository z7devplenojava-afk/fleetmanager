import api from '@/lib/axios';
import { Vehicle, FuelRecord, Fine, Maintenance } from '../types/fleet';

// Tipos para a API
interface VehicleAPI {
  id: string; // UUID
  plate: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  fuelType: 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX';
  capacity: number;
  currentMileage: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  insuranceExpiryDate?: string;
  documentationExpiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface FuelRecordAPI {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  fuelType: 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX';
  quantity: number;
  cost: number;
  mileage: number;
  station: string;
  notes?: string;
  createdAt: string;
}

interface FineAPI {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId?: string;
  driverName?: string;
  driverLicenseNumber?: string;
  date: string;
  description: string;
  amount: number;
  location: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  dueDate?: string;
  paymentDate?: string;
  createdAt: string;
}

interface MaintenanceAPI {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION';
  description: string;
  cost: number;
  mileage: number;
  workshop: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completionDate?: string;
  notes?: string;
  createdAt: string;
}

class FleetService {
  // Veículos
  async getVehicles(): Promise<Vehicle[]> {
    console.log('🔍 FleetService - Buscando veículos...');
    try {
      const response = await api.get('/api/frota/vehicles');
      console.log('✅ FleetService - Veículos encontrados:', response.data);
      console.log('🔍 FleetService - Tipo de resposta:', typeof response.data);
      console.log('🔍 FleetService - É array?', Array.isArray(response.data));
      console.log('🔍 FleetService - Quantidade:', response.data?.length);
      
      // Verificar se a resposta é válida
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('⚠️ FleetService - Resposta inválida, retornando array vazio');
        return [];
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ FleetService - Erro ao buscar veículos:', error);
      
      // Se for erro 500, retornar array vazio em vez de lançar erro
      if (error.response?.status === 500) {
        console.warn('⚠️ FleetService - Erro 500 do servidor, retornando array vazio');
        return [];
      }
      
      throw error;
    }
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const response = await api.get(`/api/frota/vehicles/${id}`);
    return response.data;
  }

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    const response = await api.post('/api/frota/vehicles', vehicle);
    return response.data;
  }

  async updateVehicle(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.put(`/api/frota/vehicles/${id}`, vehicle);
    return response.data;
  }

  async deleteVehicle(id: string): Promise<void> {
    await api.delete(`/api/frota/vehicles/${id}`);
  }

  /** Exclusão em massa (soft delete). Retorna { requested, deleted }. */
  async bulkDeleteVehicles(ids: string[]): Promise<{ requested: number; deleted: number }> {
    const response = await api.post('/api/frota/vehicles/bulk-delete', ids);
    return response.data;
  }

  // Buscar data da última manutenção de um veículo
  async getLastMaintenanceDate(vehicleId: string): Promise<string | null> {
    try {
      console.log('🔍 FleetService - Buscando data da última manutenção para veículo:', vehicleId);
      const response = await api.get(`/api/maintenances/vehicle/${vehicleId}/last-date`);
      const lastMaintenanceDate = response.data;
      console.log('✅ FleetService - Data da última manutenção:', lastMaintenanceDate);
      return lastMaintenanceDate;
    } catch (error) {
      console.error('❌ FleetService - Erro ao buscar data da última manutenção:', error);
      return null;
    }
  }

  // Registros de Abastecimento
  async getFuelRecords(vehicleId?: string): Promise<FuelRecord[]> {
    try {
      const url = vehicleId ? `/api/fuel-records?vehicleId=${vehicleId}` : '/api/fuel-records';
      console.log('🔍 FleetService - Buscando registros de abastecimento:', url);
      
      const response = await api.get(url);
      console.log('✅ FleetService - Registros de abastecimento encontrados:', response.data);
      console.log('🔍 FleetService - Quantidade de registros:', response.data?.length);
      
      // Debug do primeiro registro
      if (response.data && response.data.length > 0) {
        const firstRecord = response.data[0];
        console.log('🔍 FleetService - Primeiro registro:', firstRecord);
        console.log('🔍 FleetService - Campos de quilometragem do primeiro registro:');
        console.log('  - mileage:', firstRecord.mileage, 'tipo:', typeof firstRecord.mileage);
        console.log('  - initialMileage:', firstRecord.initialMileage, 'tipo:', typeof firstRecord.initialMileage);
        console.log('  - finalMileage:', firstRecord.finalMileage, 'tipo:', typeof firstRecord.finalMileage);
        console.log('  - driver:', firstRecord.driver);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ FleetService - Erro ao buscar registros de abastecimento:', error);
      throw error;
    }
  }

  async createFuelRecord(data: FormData): Promise<FuelRecord> {
    const response = await api.post('/api/fuel-records', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateFuelRecord(id: string, record: FormData | Partial<FuelRecord>): Promise<FuelRecord> {
    const isFormData = typeof FormData !== 'undefined' && record instanceof FormData;
    const response = await api.put(`/api/fuel-records/${id}`, record, isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : undefined);
    return response.data;
  }

  async deleteFuelRecord(id: string): Promise<void> {
    await api.delete(`/api/fuel-records/${id}`);
  }

  // Multas
  async getFines(vehicleId?: string): Promise<Fine[]> {
    const url = vehicleId ? `/api/fines?vehicleId=${vehicleId}` : '/api/fines';
    const response = await api.get(url);
    return response.data;
  }

  async createFine(fine: Omit<Fine, 'id' | 'createdAt'>): Promise<Fine> {
    const response = await api.post('/api/fines', fine);
    return response.data;
  }

  async updateFine(id: string, fine: Partial<Fine>): Promise<Fine> {
    const response = await api.put(`/api/fines/${id}`, fine);
    return response.data;
  }

  async deleteFine(id: string): Promise<void> {
    await api.delete(`/api/fines/${id}`);
  }

  // Manutenções
  async getMaintenances(vehicleId?: string): Promise<Maintenance[]> {
    const url = vehicleId ? `/api/maintenances?vehicleId=${vehicleId}` : '/api/maintenances';
    const response = await api.get(url);
    return response.data;
  }

  async createMaintenance(maintenance: Omit<Maintenance, 'id' | 'createdAt'>): Promise<Maintenance> {
    const response = await api.post('/api/maintenances', maintenance);
    return response.data;
  }

  async updateMaintenance(id: string, maintenance: Partial<Maintenance>): Promise<Maintenance> {
    const response = await api.put(`/api/maintenances/${id}`, maintenance);
    return response.data;
  }

  async deleteMaintenance(id: string): Promise<void> {
    await api.delete(`/api/maintenances/${id}`);
  }

  async getLastFuelRecord(vehicleId: string): Promise<FuelRecord | null> {
    try {
      const response = await api.get(`/api/fuel-records/last/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.warn(`Não foi possível buscar o último abastecimento para o veículo ${vehicleId}:`, error);
      return null;
    }
  }

  async getFuelRecordsWithFilters(filters: {
    startDate?: string;
    endDate?: string;
    vehicleId?: string;
    station?: string;
    minCost?: number;
    maxCost?: number;
  }): Promise<FuelRecord[]> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters.station) params.append('station', filters.station);
    if (filters.minCost) params.append('minCost', String(filters.minCost));
    if (filters.maxCost) params.append('maxCost', String(filters.maxCost));

    const response = await api.get(`/api/fuel-records/filter?${params.toString()}`);
    return response.data;
  }

  async getFuelRecordsReport(filters: {
    vehicleId?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<FuelRecord[]> {
    const params = new URLSearchParams();
    if (filters.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters.driverId) params.append('driverId', filters.driverId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/api/fuel-records/report/filtered?${params.toString()}`);
    return response.data;
  }

  async getFilteredFuelRecords(filters: {
    vehicleId?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<FuelRecord[]> {
    return this.getFuelRecordsReport(filters);
  }

  async exportFuelRecordsPDF(filters: {
    vehicleId?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
    fuelType?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters.driverId) params.append('driverId', filters.driverId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.fuelType) params.append('fuelType', filters.fuelType);

    const response = await api.get(`/api/fuel-records/report/pdf?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportFuelRecordsExcel(filters: {
    vehicleId?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters.driverId) params.append('driverId', filters.driverId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/api/fuel-records/report/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportVehiclesReportPDF(status?: string, companyId?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (companyId) params.append('companyId', companyId);

    try {
      const response = await api.get(`/api/vehicles/report/pdf?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Verificar se a resposta é um erro JSON (quando o backend retorna JSON de erro)
      if (response.data instanceof Blob && response.data.type === 'application/json') {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || errorData.error || 'Erro ao gerar relatório PDF');
      }
      
      return response.data;
    } catch (error: any) {
      // Se for um Blob com tipo JSON, tentar ler o erro
      if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || errorData.error || 'Erro ao gerar relatório PDF');
        } catch (parseError) {
          throw new Error('Erro ao processar resposta do servidor');
        }
      }
      
      // Se for uma resposta de erro normal
      if (error.response?.data) {
        const errorMessage = error.response.data.message || error.response.data.error || 'Erro ao gerar relatório PDF';
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  }

  async getDrivers(): Promise<string[]> {
    const response = await api.get('/api/fuel-records/stats/drivers');
    return response.data;
  }

  // Gerar relatório PDF de manutenções
  async exportMaintenancesReportPDF(filters: {
    startDate?: string;
    endDate?: string;
    vehicleId?: string;
    status?: string;
    maintenanceType?: string;
    description?: string;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.vehicleId) params.append('vehicleId', filters.vehicleId);
      if (filters.status) params.append('status', filters.status);
      if (filters.maintenanceType) params.append('maintenanceType', filters.maintenanceType);
      if (filters.description) params.append('description', filters.description);

      const response = await api.get(`/api/maintenances/report/pdf?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      throw new Error('Falha ao gerar relatório PDF');
    }
  }

  // Gerar relatório PDF de multas
  async exportFinesReportPDF(filters: {
    vehiclePlate?: string;
    driverName?: string;
    infraction?: string;
    startDate?: string;
    endDate?: string;
    dueDateStart?: string;
    dueDateEnd?: string;
    minValue?: number;
    maxValue?: number;
    status?: string;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (filters.vehiclePlate) params.append('vehiclePlate', filters.vehiclePlate);
      if (filters.driverName) params.append('driverName', filters.driverName);
      if (filters.infraction) params.append('infraction', filters.infraction);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.dueDateStart) params.append('dueDateStart', filters.dueDateStart);
      if (filters.dueDateEnd) params.append('dueDateEnd', filters.dueDateEnd);
      if (filters.minValue !== undefined) params.append('minValue', filters.minValue.toString());
      if (filters.maxValue !== undefined) params.append('maxValue', filters.maxValue.toString());
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/api/fines/report/pdf?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      throw new Error('Falha ao gerar relatório PDF');
    }
  }

  // ===== FINE REPORTS =====
  
  async generateFineReportPDF(params: {
    startDate?: string;
    endDate?: string;
    vehicleFilter?: string;
    driverFilter?: string;
    statusFilter?: string;
    amountMin?: number;
    amountMax?: number;
    selectedIds?: string[];
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.vehicleFilter) queryParams.append('vehicleFilter', params.vehicleFilter);
    if (params.driverFilter) queryParams.append('driverFilter', params.driverFilter);
    if (params.statusFilter) queryParams.append('statusFilter', params.statusFilter);
    if (params.amountMin) queryParams.append('amountMin', params.amountMin.toString());
    if (params.amountMax) queryParams.append('amountMax', params.amountMax.toString());
    if (params.selectedIds && params.selectedIds.length > 0) {
      params.selectedIds.forEach(id => queryParams.append('selectedIds', id));
    }
    
    const response = await api.get(`/api/fines/reports/pdf?${queryParams.toString()}`);
    
    return response.data;
  }
  
  async generateFineReportExcel(params: {
    startDate?: string;
    endDate?: string;
    vehicleFilter?: string;
    driverFilter?: string;
    statusFilter?: string;
    amountMin?: number;
    amountMax?: number;
    selectedIds?: string[];
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.vehicleFilter) queryParams.append('vehicleFilter', params.vehicleFilter);
    if (params.driverFilter) queryParams.append('driverFilter', params.driverFilter);
    if (params.statusFilter) queryParams.append('statusFilter', params.statusFilter);
    if (params.amountMin) queryParams.append('amountMin', params.amountMin.toString());
    if (params.amountMax) queryParams.append('amountMax', params.amountMax.toString());
    if (params.selectedIds && params.selectedIds.length > 0) {
      params.selectedIds.forEach(id => queryParams.append('selectedIds', id));
    }
    
    const response = await api.get(`/api/fines/reports/excel?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  async importVehiclesExcel(file: File): Promise<{
    totalRows: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/vehicles/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // QR Code do Veículo
  async getVehicleQRCodeData(vehicleId: string): Promise<VehicleQRCodeData> {
    const response = await api.get(`/api/vehicles/${vehicleId}/qrcode`);
    return response.data;
  }

  getVehicleQRCodeImageUrl(vehicleId: string, width = 350, height = 350): string {
    return `/api/vehicles/${vehicleId}/qrcode/image?width=${width}&height=${height}`;
  }
}

export interface VehicleQRCodeData {
  vehicleId: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  color?: string;
  fuelType?: string;
  currentMileage?: number;
  status: string;

  garageId?: string;
  garageName?: string;
  garageAddress?: string;

  clientId?: string;
  clientName?: string;
  clientCnpj?: string;

  workPostId?: string;
  workPostName?: string;
  workPostCode?: string;

  driverId?: string;
  driverName?: string;
  driverCpf?: string;
  driverLicenseNumber?: string;

  lastWorkOrderId?: string;
  lastWorkOrderNumber?: string;
  lastWorkOrderDate?: string;
  lastWorkOrderStatus?: string;
  lastWorkOrderType?: string;
  lastWorkOrderCost?: number;
  lastWorkOrderDescription?: string;

  qrCodeTextPayload?: string;
  qrCodeGeneratedAt?: string;
}

export const fleetService = new FleetService();
export default fleetService;