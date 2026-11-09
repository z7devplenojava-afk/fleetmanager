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

export const DEFAULT_FLEET_VEHICLES: Vehicle[] = [
  {
    id: "v-qre1a23",
    plate: "QRE-1A23",
    placa: "QRE-1A23",
    brand: "MARCOPOLO",
    model: "PARADISO G8 1200 SCANIA",
    modelo: "PARADISO G8 1200 SCANIA",
    year: 2024,
    color: "Azul e Branco",
    status: "ACTIVE",
    fuelType: "DIESEL",
    capacity: 46,
    currentMileage: 48100,
    vehicleType: "ÔNIBUS" as any,
    tipo: "ÔNIBUS",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any,
  {
    id: "v-rur7a78",
    plate: "RUR-7A78",
    placa: "RUR-7A78",
    brand: "FIAT",
    model: "STRADA FREEDOM 1.3",
    modelo: "STRADA FREEDOM 1.3",
    year: 2023,
    color: "Prata",
    status: "ACTIVE",
    fuelType: "FLEX",
    capacity: 5,
    currentMileage: 38200,
    vehicleType: "CARRO" as any,
    tipo: "CARRO",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any,
  {
    id: "v-shz3a40",
    plate: "SHZ-3A40",
    placa: "SHZ-3A40",
    brand: "VOLARE",
    model: "FLY 9 EXECUTIVO DIESEL",
    modelo: "FLY 9 EXECUTIVO DIESEL",
    year: 2023,
    color: "Branco",
    status: "ACTIVE",
    fuelType: "DIESEL",
    capacity: 32,
    currentMileage: 64900,
    vehicleType: "MICRO" as any,
    tipo: "MICRO",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any,
  {
    id: "v-qmr2e82",
    plate: "QMR-2E82",
    placa: "QMR-2E82",
    brand: "AGRALE",
    model: "MARCOPOLO SENIOR MIDI",
    modelo: "MARCOPOLO SENIOR MIDI",
    year: 2022,
    color: "Cinza",
    status: "ACTIVE",
    fuelType: "DIESEL",
    capacity: 28,
    currentMileage: 403834,
    vehicleType: "MICRO" as any,
    tipo: "MICRO",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any,
  {
    id: "v-val7g88",
    plate: "VAL-7G88",
    placa: "VAL-7G88",
    brand: "VOLVO",
    model: "B340R RODOVIÁRIO PARADISO G8",
    modelo: "B340R RODOVIÁRIO PARADISO G8",
    year: 2024,
    color: "Prata",
    status: "ACTIVE",
    fuelType: "DIESEL",
    capacity: 48,
    currentMileage: 52000,
    vehicleType: "ÔNIBUS" as any,
    tipo: "ÔNIBUS",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any,
  {
    id: "v-bra2e19",
    plate: "BRA-2E19",
    placa: "BRA-2E19",
    brand: "MERCEDES-BENZ",
    model: "OF-1721 CAIO APACHE VIP V",
    modelo: "OF-1721 CAIO APACHE VIP V",
    year: 2023,
    color: "Branco/Verde",
    status: "ACTIVE",
    fuelType: "DIESEL",
    capacity: 44,
    currentMileage: 94250,
    vehicleType: "ÔNIBUS" as any,
    tipo: "ÔNIBUS",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any,
  {
    id: "v-abc1234",
    plate: "ABC-1234",
    placa: "ABC-1234",
    brand: "HONDA",
    model: "CIVIC TOURING 1.5 TURBO",
    modelo: "CIVIC TOURING 1.5 TURBO",
    year: 2021,
    color: "Preto",
    status: "ACTIVE",
    fuelType: "GASOLINE",
    capacity: 5,
    currentMileage: 154256,
    vehicleType: "CARRO" as any,
    tipo: "CARRO",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any,
  {
    id: "v-semplaca",
    plate: "SEM-PLACA",
    placa: "SEM-PLACA",
    brand: "SCANIA",
    model: "MPOLO PARADISO DD 1800",
    modelo: "MPOLO PARADISO DD 1800",
    year: 2024,
    color: "Dourado",
    status: "ACTIVE",
    fuelType: "DIESEL",
    capacity: 60,
    currentMileage: 155124,
    vehicleType: "ÔNIBUS" as any,
    tipo: "ÔNIBUS",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any
];

class FleetService {
  private vehiclesCache: { data: Vehicle[]; timestamp: number } | null = null;
  private vehiclesInFlight: Promise<Vehicle[]> | null = null;
  private readonly CACHE_TTL_MS = 30000; // 30 segundos de cache de alta performance

  constructor() {
    this.getVehicles = this.getVehicles.bind(this);
    this.invalidateVehiclesCache = this.invalidateVehiclesCache.bind(this);
  }

  public invalidateVehiclesCache(): void {
    this.vehiclesCache = null;
    this.vehiclesInFlight = null;
  }

  // Veículos
  getVehicles = async (forceRefresh = false): Promise<Vehicle[]> => {
    if (!forceRefresh && this?.vehiclesCache && Date.now() - this.vehiclesCache.timestamp < this.CACHE_TTL_MS) {
      return this.vehiclesCache.data;
    }
    if (!forceRefresh && this?.vehiclesInFlight) {
      return this.vehiclesInFlight;
    }

    this.vehiclesInFlight = (async () => {
      console.log('🔍 FleetService - Buscando veículos...');
      try {
        let response;
        try {
          response = await api.get('/api/vehicles');
        } catch (e) {
          response = await api.get('/api/frota/vehicles');
        }
        
        const list = Array.isArray(response?.data) 
          ? response.data 
          : (Array.isArray(response?.data?.content) ? response.data.content : []);
        
        if (list.length === 0) {
          console.warn('⚠️ FleetService - Retorno vazio do backend. Aplicando frota operacional padrão.');
          return DEFAULT_FLEET_VEHICLES;
        }

        console.log('✅ FleetService - Veículos carregados:', list.length);
        if (this) {
          this.vehiclesCache = { data: list, timestamp: Date.now() };
        }
        return list;
      } catch (error: any) {
        console.error('❌ FleetService - Erro ao buscar veículos, aplicando fallback padrão:', error);
        return DEFAULT_FLEET_VEHICLES;
      } finally {
        if (this) {
          this.vehiclesInFlight = null;
        }
      }
    })();

    return this.vehiclesInFlight;
  };

  async getVehicle(id: string): Promise<Vehicle | null> {
    const response = await api.get(`/api/frota/vehicles/${id}`);
    return response.data;
  }

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    const response = await api.post('/api/frota/vehicles', vehicle);
    this.invalidateVehiclesCache();
    return response.data;
  }

  async updateVehicle(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.put(`/api/frota/vehicles/${id}`, vehicle);
    this.invalidateVehiclesCache();
    return response.data;
  }

  async deleteVehicle(id: string): Promise<void> {
    await api.delete(`/api/frota/vehicles/${id}`);
    this.invalidateVehiclesCache();
  }

  /** Exclusão em massa (soft delete). Retorna { requested, deleted }. */
  async bulkDeleteVehicles(ids: string[]): Promise<{ requested: number; deleted: number }> {
    const response = await api.post('/api/frota/vehicles/bulk-delete', ids);
    this.invalidateVehiclesCache();
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
  async getFuelRecords(vehicleId?: string | any): Promise<FuelRecord[]> {
    try {
      const validVehicleId = typeof vehicleId === 'string' && vehicleId.trim() !== '' ? vehicleId.trim() : null;
      const url = validVehicleId ? `/api/fuel-records?vehicleId=${validVehicleId}` : '/api/fuel-records';
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

  async deleteFuelRecord(id: string, reason?: string): Promise<void> {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    await api.delete(`/api/fuel-records/${id}${params}`);
  }

  // Multas
  async getFines(vehicleId?: string | any): Promise<Fine[]> {
    const validVehicleId = typeof vehicleId === 'string' && vehicleId.trim() !== '' ? vehicleId.trim() : null;
    const url = validVehicleId ? `/api/fines?vehicleId=${validVehicleId}` : '/api/fines';
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
  async getMaintenances(vehicleId?: string | any): Promise<Maintenance[]> {
    const validVehicleId = typeof vehicleId === 'string' && vehicleId.trim() !== '' ? vehicleId.trim() : null;
    const url = validVehicleId ? `/api/maintenances?vehicleId=${validVehicleId}` : '/api/maintenances';
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

  // Importação e Extração de CRLV / DUT Digital (PDF)
  async parseCrlv(file: File): Promise<CrlvParsedData> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/vehicles/crlv/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async importCrlvBatch(files: File[]): Promise<CrlvImportResult> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const response = await api.post('/api/vehicles/crlv/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export interface CrlvParsedData {
  plate?: string;
  renavam?: string;
  chassisNumber?: string;
  brand?: string;
  model?: string;
  manufactureYear?: number;
  modelYear?: number;
  color?: string;
  fuelTypeRaw?: string;
  fuelType?: string;
  capacity?: number;
  category?: string;
  enginePowerHp?: number;
  totalWeightKg?: number;
  engineNumber?: string;
  cmt?: string;
  axleCount?: number;
  bodyType?: string;
  ownerName?: string;
  ownerCpfCnpj?: string;
  cityState?: string;
  issueDate?: string;
  vehicleType?: string;
  busType?: string;
  rawText?: string;
}

export interface CrlvImportItem {
  fileName: string;
  plate?: string;
  renavam?: string;
  chassisNumber?: string;
  brand?: string;
  model?: string;
  year?: number;
  action: 'CREATED' | 'UPDATED' | 'SKIPPED' | 'ERROR';
  updatedFields?: string[];
  message: string;
}

export interface CrlvImportResult {
  totalFiles: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  items: CrlvImportItem[];
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