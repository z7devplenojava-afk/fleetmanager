import { Vehicle } from '@/types/fleet';

interface Tire {
  id: string;
  code: string;
  brand: string;
  model: string;
  size: string;
  type: 'FRONT' | 'REAR' | 'SPARE';
  purchaseDate: string;
  purchaseValue: number;
  currentVehicleId?: string;
  currentVehiclePlate?: string;
  status: 'IN_USE' | 'SPARE' | 'MAINTENANCE' | 'DAMAGED' | 'RETIRED';
  currentMileage?: number;
  lastMileage?: number;
  expectedLifeMileage: number;
  position?: 'FRONT_LEFT' | 'FRONT_RIGHT' | 'REAR_LEFT' | 'REAR_RIGHT' | 'SPARE';
  treadDepth?: number;
  lastInspectionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TireMovement {
  id: string;
  tireId: string;
  tireCode: string;
  vehicleId: string;
  vehiclePlate: string;
  movementType: 'INSTALLATION' | 'REMOVAL' | 'ROTATION' | 'INSPECTION';
  position?: string;
  mileage: number;
  previousMileage?: number;
  reason?: string;
  technicianName?: string;
  createdAt: string;
}

interface TireInventory {
  availableTires: Tire[];
  inUseTires: Tire[];
  vehiclesWithTires: VehicleTireInfo[];
  summary: {
    total: number;
    inUse: number;
    available: number;
    maintenance: number;
    damaged: number;
    retired: number;
  };
}

interface VehicleTireInfo {
  vehicleId: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  tires: Tire[];
  tireCount: number;
  lastRotation?: string;
  nextRotationMileage?: number;
}

interface TireInspection {
  id: string;
  tireId: string;
  tireCode: string;
  vehicleId: string;
  vehiclePlate: string;
  treadDepth: number;
  pressure: number;
  damageDescription?: string;
  recommendations?: string;
  inspectorName: string;
  inspectionDate: string;
  mileage: number;
  overallCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
}

class TireTrackingService {
  private static instance: TireTrackingService;
  private tires: Tire[] = [];
  private movements: TireMovement[] = [];
  private inspections: TireInspection[] = [];

  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): TireTrackingService {
    if (!TireTrackingService.instance) {
      TireTrackingService.instance = new TireTrackingService();
    }
    return TireTrackingService.instance;
  }

  private initializeMockData() {
    // Pneus mockados com códigos únicos
    this.tires = [
      {
        id: '1',
        code: 'PNEU-001',
        brand: 'Michelin',
        model: 'XZY3',
        size: '205/75R16',
        type: 'FRONT',
        purchaseDate: '2023-01-15',
        purchaseValue: 450.00,
        currentVehicleId: 'veh-001',
        currentVehiclePlate: 'ABC-1234',
        status: 'IN_USE',
        currentMileage: 45680,
        lastMileage: 42000,
        expectedLifeMileage: 80000,
        position: 'FRONT_LEFT',
        treadDepth: 8.5,
        lastInspectionDate: '2024-03-15',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-03-15T14:30:00Z'
      },
      {
        id: '2',
        code: 'PNEU-002',
        brand: 'Michelin',
        model: 'XZY3',
        size: '205/75R16',
        type: 'FRONT',
        purchaseDate: '2023-01-15',
        purchaseValue: 450.00,
        currentVehicleId: 'veh-001',
        currentVehiclePlate: 'ABC-1234',
        status: 'IN_USE',
        currentMileage: 45680,
        lastMileage: 42000,
        expectedLifeMileage: 80000,
        position: 'FRONT_RIGHT',
        treadDepth: 8.2,
        lastInspectionDate: '2024-03-15',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-03-15T14:30:00Z'
      },
      {
        id: '3',
        code: 'PNEU-003',
        brand: 'Michelin',
        model: 'XZY3',
        size: '205/75R16',
        type: 'REAR',
        purchaseDate: '2023-01-15',
        purchaseValue: 450.00,
        currentVehicleId: 'veh-001',
        currentVehiclePlate: 'ABC-1234',
        status: 'IN_USE',
        currentMileage: 45680,
        lastMileage: 42000,
        expectedLifeMileage: 80000,
        position: 'REAR_LEFT',
        treadDepth: 7.8,
        lastInspectionDate: '2024-03-15',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-03-15T14:30:00Z'
      },
      {
        id: '4',
        code: 'PNEU-004',
        brand: 'Michelin',
        model: 'XZY3',
        size: '205/75R16',
        type: 'REAR',
        purchaseDate: '2023-01-15',
        purchaseValue: 450.00,
        currentVehicleId: 'veh-001',
        currentVehiclePlate: 'ABC-1234',
        status: 'IN_USE',
        currentMileage: 45680,
        lastMileage: 42000,
        expectedLifeMileage: 80000,
        position: 'REAR_RIGHT',
        treadDepth: 7.5,
        lastInspectionDate: '2024-03-15',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-03-15T14:30:00Z'
      },
      {
        id: '5',
        code: 'PNEU-005',
        brand: 'Bridgestone',
        model: 'R230',
        size: '205/75R16',
        type: 'SPARE',
        purchaseDate: '2023-06-20',
        purchaseValue: 380.00,
        status: 'SPARE',
        currentMileage: 0,
        lastMileage: 0,
        expectedLifeMileage: 60000,
        treadDepth: 10.0,
        createdAt: '2023-06-20T10:00:00Z',
        updatedAt: '2023-06-20T10:00:00Z'
      },
      {
        id: '6',
        code: 'PNEU-006',
        brand: 'Bridgestone',
        model: 'R230',
        size: '205/75R16',
        type: 'FRONT',
        purchaseDate: '2023-02-10',
        purchaseValue: 380.00,
        currentVehicleId: 'veh-002',
        currentVehiclePlate: 'DEF-5678',
        status: 'IN_USE',
        currentMileage: 78920,
        lastMileage: 75000,
        expectedLifeMileage: 60000,
        position: 'FRONT_LEFT',
        treadDepth: 6.2,
        lastInspectionDate: '2024-03-20',
        createdAt: '2023-02-10T10:00:00Z',
        updatedAt: '2024-03-20T16:45:00Z'
      },
      {
        id: '7',
        code: 'PNEU-007',
        brand: 'Bridgestone',
        model: 'R230',
        size: '205/75R16',
        type: 'FRONT',
        purchaseDate: '2023-02-10',
        purchaseValue: 380.00,
        currentVehicleId: 'veh-002',
        currentVehiclePlate: 'DEF-5678',
        status: 'IN_USE',
        currentMileage: 78920,
        lastMileage: 75000,
        expectedLifeMileage: 60000,
        position: 'FRONT_RIGHT',
        treadDepth: 6.0,
        lastInspectionDate: '2024-03-20',
        createdAt: '2023-02-10T10:00:00Z',
        updatedAt: '2024-03-20T16:45:00Z'
      },
      {
        id: '8',
        code: 'PNEU-008',
        brand: 'Bridgestone',
        model: 'R230',
        size: '205/75R16',
        type: 'REAR',
        purchaseDate: '2023-02-10',
        purchaseValue: 380.00,
        currentVehicleId: 'veh-002',
        currentVehiclePlate: 'DEF-5678',
        status: 'IN_USE',
        currentMileage: 78920,
        lastMileage: 75000,
        expectedLifeMileage: 60000,
        position: 'REAR_LEFT',
        treadDepth: 5.8,
        lastInspectionDate: '2024-03-20',
        createdAt: '2023-02-10T10:00:00Z',
        updatedAt: '2024-03-20T16:45:00Z'
      },
      {
        id: '9',
        code: 'PNEU-009',
        brand: 'Bridgestone',
        model: 'R230',
        size: '205/75R16',
        type: 'REAR',
        purchaseDate: '2023-02-10',
        purchaseValue: 380.00,
        currentVehicleId: 'veh-002',
        currentVehiclePlate: 'DEF-5678',
        status: 'IN_USE',
        currentMileage: 78920,
        lastMileage: 75000,
        expectedLifeMileage: 60000,
        position: 'REAR_RIGHT',
        treadDepth: 5.5,
        lastInspectionDate: '2024-03-20',
        createdAt: '2023-02-10T10:00:00Z',
        updatedAt: '2024-03-20T16:45:00Z'
      },
      {
        id: '10',
        code: 'PNEU-010',
        brand: 'Goodyear',
        model: 'Wrangler AT/S',
        size: '215/75R16',
        type: 'SPARE',
        purchaseDate: '2023-08-15',
        purchaseValue: 420.00,
        status: 'SPARE',
        currentMileage: 0,
        lastMileage: 0,
        expectedLifeMileage: 70000,
        treadDepth: 11.0,
        createdAt: '2023-08-15T10:00:00Z',
        updatedAt: '2023-08-15T10:00:00Z'
      },
      {
        id: '11',
        code: 'PNEU-011',
        brand: 'Firestone',
        model: 'Destination LE',
        size: '225/70R16',
        type: 'MAINTENANCE',
        purchaseDate: '2023-04-20',
        purchaseValue: 350.00,
        status: 'MAINTENANCE',
        currentMileage: 45000,
        lastMileage: 42000,
        expectedLifeMileage: 50000,
        treadDepth: 3.0,
        notes: 'Sulco profundo, necessita recapagem',
        createdAt: '2023-04-20T10:00:00Z',
        updatedAt: '2024-03-25T10:00:00Z'
      }
    ];

    // Inicializar movimentações
    this.movements = [
      {
        id: '1',
        tireId: '1',
        tireCode: 'PNEU-001',
        vehicleId: 'veh-001',
        vehiclePlate: 'ABC-1234',
        movementType: 'INSTALLATION',
        position: 'FRONT_LEFT',
        mileage: 42000,
        reason: 'Instalação inicial',
        technicianName: 'João Mecânico',
        createdAt: '2023-01-15T10:00:00Z'
      },
      {
        id: '2',
        tireId: '6',
        tireCode: 'PNEU-006',
        vehicleId: 'veh-002',
        vehiclePlate: 'DEF-5678',
        movementType: 'INSTALLATION',
        position: 'FRONT_LEFT',
        mileage: 75000,
        reason: 'Instalação inicial',
        technicianName: 'Carlos Mecânico',
        createdAt: '2023-02-10T10:00:00Z'
      },
      {
        id: '3',
        tireId: '11',
        tireCode: 'PNEU-011',
        vehicleId: 'veh-001',
        vehiclePlate: 'ABC-1234',
        movementType: 'REMOVAL',
        mileage: 45000,
        previousMileage: 42000,
        reason: 'Remoção para manutenção - sulco profundo',
        technicianName: 'João Mecânico',
        createdAt: '2024-03-25T10:00:00Z'
      }
    ];
  }

  // Métodos principais

  async getAllTires(): Promise<Tire[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.tires), 300);
    });
  }

  async getTireByCode(code: string): Promise<Tire | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const tire = this.tires.find(t => t.code === code);
        resolve(tire || null);
      }, 200);
    });
  }

  async getTiresByVehicle(vehicleId: string): Promise<Tire[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const vehicleTires = this.tires.filter(t => t.currentVehicleId === vehicleId);
        resolve(vehicleTires);
      }, 200);
    });
  }

  async getTiresByVehiclePlate(vehiclePlate: string): Promise<Tire[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const vehicleTires = this.tires.filter(t => t.currentVehiclePlate === vehiclePlate);
        resolve(vehicleTires);
      }, 200);
    });
  }

  async getTireInventory(): Promise<TireInventory> {
    return new Promise(resolve => {
      setTimeout(() => {
        const availableTires = this.tires.filter(t => t.status === 'SPARE');
        const inUseTires = this.tires.filter(t => t.status === 'IN_USE');
        const maintenanceTires = this.tires.filter(t => t.status === 'MAINTENANCE');
        const damagedTires = this.tires.filter(t => t.status === 'DAMAGED');
        const retiredTires = this.tires.filter(t => t.status === 'RETIRED');

        // Agrupar por veículo
        const vehiclesMap = new Map<string, Tire[]>();
        inUseTires.forEach(tire => {
          if (tire.currentVehicleId) {
            if (!vehiclesMap.has(tire.currentVehicleId)) {
              vehiclesMap.set(tire.currentVehicleId, []);
            }
            vehiclesMap.get(tire.currentVehicleId)!.push(tire);
          }
        });

        const vehiclesWithTires: VehicleTireInfo[] = Array.from(vehiclesMap.entries()).map(([vehicleId, tires]) => ({
          vehicleId,
          vehiclePlate: tires[0]?.currentVehiclePlate || '',
          vehicleBrand: 'Mock Brand', // Em produção, buscar do serviço de veículos
          vehicleModel: 'Mock Model',
          tires,
          tireCount: tires.length,
          lastRotation: '2024-01-15', // Em produção, calcular baseado nas movimentações
          nextRotationMileage: 50000 // Em produção, calcular baseado na quilometragem
        }));

        resolve({
          availableTires,
          inUseTires,
          vehiclesWithTires,
          summary: {
            total: this.tires.length,
            inUse: inUseTires.length,
            available: availableTires.length,
            maintenance: maintenanceTires.length,
            damaged: damagedTires.length,
            retired: retiredTires.length
          }
        });
      }, 300);
    });
  }

  async createTire(tireData: Omit<Tire, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tire> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newTire: Tire = {
          id: Date.now().toString(),
          code: `PNEU-${String(this.tires.length + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...tireData
        };

        this.tires.push(newTire);
        resolve(newTire);
      }, 400);
    });
  }

  async updateTire(id: string, tireData: Partial<Tire>): Promise<Tire> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const tireIndex = this.tires.findIndex(t => t.id === id);
        if (tireIndex === -1) {
          reject(new Error('Pneu não encontrado'));
          return;
        }

        this.tires[tireIndex] = {
          ...this.tires[tireIndex],
          ...tireData,
          updatedAt: new Date().toISOString()
        };

        resolve(this.tires[tireIndex]);
      }, 300);
    });
  }

  async deleteTire(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const tireIndex = this.tires.findIndex(t => t.id === id);
        if (tireIndex === -1) {
          reject(new Error('Pneu não encontrado'));
          return;
        }

        this.tires.splice(tireIndex, 1);
        resolve();
      }, 300);
    });
  }

  // Métodos de movimentação

  async createTireMovement(movementData: Omit<TireMovement, 'id' | 'createdAt'>): Promise<TireMovement> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newMovement: TireMovement = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          ...movementData
        };

        this.movements.push(newMovement);

        // Atualizar status do pneu se necessário
        if (movementData.movementType === 'INSTALLATION') {
          this.updateTireStatus(movementData.tireId, 'IN_USE');
        } else if (movementData.movementType === 'REMOVAL') {
          this.updateTireStatus(movementData.tireId, 'SPARE');
        }

        resolve(newMovement);
      }, 300);
    });
  }

  async getTireMovements(tireId?: string): Promise<TireMovement[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const movements = tireId 
          ? this.movements.filter(m => m.tireId === tireId)
          : this.movements;
        resolve(movements);
      }, 200);
    });
  }

  // Métodos de inspeção

  async createTireInspection(inspectionData: Omit<TireInspection, 'id' | 'createdAt'>): Promise<TireInspection> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newInspection: TireInspection = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          ...inspectionData
        };

        this.inspections.push(newInspection);

        // Atualizar profundidade do sulco no pneu
        if (inspectionData.tireId && inspectionData.treadDepth !== undefined) {
          this.updateTire(inspectionData.tireId, {
            treadDepth: inspectionData.treadDepth,
            lastInspectionDate: inspectionData.inspectionDate
          });
        }

        resolve(newInspection);
      }, 300);
    });
  }

  async getTireInspections(tireId?: string): Promise<TireInspection[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const inspections = tireId 
          ? this.inspections.filter(i => i.tireId === tireId)
          : this.inspections;
        resolve(inspections);
      }, 200);
    });
  }

  // Métodos de busca e filtros

  async searchTires(query: string): Promise<Tire[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const lowerQuery = query.toLowerCase();
        const filteredTires = this.tires.filter(tire => 
          tire.code.toLowerCase().includes(lowerQuery) ||
          tire.brand.toLowerCase().includes(lowerQuery) ||
          tire.model.toLowerCase().includes(lowerQuery) ||
          tire.size.toLowerCase().includes(lowerQuery) ||
          tire.currentVehiclePlate?.toLowerCase().includes(lowerQuery) ||
          tire.status.toLowerCase().includes(lowerQuery)
        );
        resolve(filteredTires);
      }, 200);
    });
  }

  async getTiresByStatus(status: Tire['status']): Promise<Tire[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const filteredTires = this.tires.filter(tire => tire.status === status);
        resolve(filteredTires);
      }, 200);
    });
  }

  async getTiresNeedingReplacement(): Promise<Tire[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const tiresNeedingReplacement = this.tires.filter(tire => {
          // Pneus em uso com profundidade de sulco baixa
          if (tire.status === 'IN_USE' && tire.treadDepth && tire.treadDepth < 4) {
            return true;
          }
          
          // Pneus próximo do fim da vida útil
          if (tire.currentMileage && tire.expectedLifeMileage) {
            const remainingLife = tire.expectedLifeMileage - tire.currentMileage;
            const lifePercentage = remainingLife / tire.expectedLifeMileage;
            if (lifePercentage < 0.1) { // Menos de 10% de vida útil
              return true;
            }
          }
          
          return false;
        });
        resolve(tiresNeedingReplacement);
      }, 300);
    });
  }

  // Métodos de relatórios

  async getTireReport(vehicleId?: string): Promise<{
    summary: any;
    tires: Tire[];
    movements: TireMovement[];
    inspections: TireInspection[];
    costs: {
      totalInvestment: number;
      averageCostPerTire: number;
      replacementForecast: number;
    };
  }> {
    return new Promise(resolve => {
      setTimeout(() => {
        const tires = vehicleId 
          ? this.tires.filter(t => t.currentVehicleId === vehicleId)
          : this.tires;
        
        const movements = vehicleId
          ? this.movements.filter(m => m.vehicleId === vehicleId)
          : this.movements;
          
        const inspections = vehicleId
          ? this.inspections.filter(i => i.vehicleId === vehicleId)
          : this.inspections;

        const totalInvestment = tires.reduce((sum, tire) => sum + tire.purchaseValue, 0);
        const averageCostPerTire = tires.length > 0 ? totalInvestment / tires.length : 0;
        const replacementForecast = tires.filter(t => 
          t.status === 'IN_USE' && 
          t.currentMileage && 
          t.expectedLifeMileage &&
          (t.expectedLifeMileage - t.currentMileage) < 5000
        ).length * 450; // Valor médio de substituição

        resolve({
          summary: {
            total: tires.length,
            inUse: tires.filter(t => t.status === 'IN_USE').length,
            available: tires.filter(t => t.status === 'SPARE').length,
            maintenance: tires.filter(t => t.status === 'MAINTENANCE').length,
            damaged: tires.filter(t => t.status === 'DAMAGED').length,
            retired: tires.filter(t => t.status === 'RETIRED').length
          },
          tires,
          movements,
          inspections,
          costs: {
            totalInvestment,
            averageCostPerTire,
            replacementForecast
          }
        });
      }, 400);
    });
  }

  // Métodos privados auxiliares

  private updateTireStatus(tireId: string, status: Tire['status']): void {
    const tireIndex = this.tires.findIndex(t => t.id === tireId);
    if (tireIndex !== -1) {
      this.tires[tireIndex].status = status;
      this.tires[tireIndex].updatedAt = new Date().toISOString();
    }
  }

  // Métodos de utilidade

  generateTireCode(): string {
    const nextNumber = this.tires.length + 1;
    return `PNEU-${String(nextNumber).padStart(3, '0')}`;
  }

  calculateTireWear(tire: Tire): number {
    if (!tire.currentMileage || !tire.expectedLifeMileage) return 0;
    
    const usedMileage = tire.currentMileage - (tire.lastMileage || 0);
    const wearPercentage = usedMileage / tire.expectedLifeMileage;
    return Math.min(wearPercentage * 100, 100);
  }

  getTireStatusLabel(status: Tire['status']): string {
    const labels: Record<Tire['status'], string> = {
      'IN_USE': 'Em Uso',
      'SPARE': 'Reserva',
      'MAINTENANCE': 'Manutenção',
      'DAMAGED': 'Danificado',
      'RETIRED': 'Aposentado'
    };
    return labels[status] || status;
  }

  getTireStatusColor(status: Tire['status']): string {
    const colors: Record<Tire['status'], string> = {
      'IN_USE': 'bg-green-100 text-green-800',
      'SPARE': 'bg-blue-100 text-blue-800',
      'MAINTENANCE': 'bg-yellow-100 text-yellow-800',
      'DAMAGED': 'bg-red-100 text-red-800',
      'RETIRED': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getPositionLabel(position?: string): string {
    const labels: Record<string, string> = {
      'FRONT_LEFT': 'Dianteiro Esquerdo',
      'FRONT_RIGHT': 'Dianteiro Direito',
      'REAR_LEFT': 'Traseiro Esquerdo',
      'REAR_RIGHT': 'Traseiro Direito',
      'SPARE': 'Reserva'
    };
    return labels[position || ''] || 'Não definida';
  }
}

export default TireTrackingService.getInstance();
