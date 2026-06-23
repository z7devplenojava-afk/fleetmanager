interface ServiceContract {
  id: string;
  contractNumber: string;
  clientName: string;
  clientId: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  serviceType: 'TRANSPORT' | 'LOGISTICS' | 'DISTRIBUTION' | 'SHUTTLE' | 'DELIVERY' | 'OTHER';
  contractType: 'FIXED_RATE' | 'PER_KM' | 'PER_HOUR' | 'HYBRID' | 'MILEAGE_BASED';
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'PENDING';
  startDate: string;
  endDate: string;
  billingCycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';
  
  // Base Rates
  baseRates: {
    fixedRate: number;
    perKmRate: number;
    perHourRate: number;
    fuelRate: number;
    driverRate: number;
    currency: 'BRL' | 'USD' | 'EUR';
  };
  
  // Contract Limits
  limits: {
    maxKmPerMonth: number;
    maxHoursPerMonth: number;
    maxFuelPerMonth: number;
    includedKm: number;
    includedHours: number;
    includedFuel: number;
    extraKmRate: number;
    extraHourRate: number;
    extraFuelRate: number;
  };
  
  // Deductions and Bonuses
  deductions: {
    retentionPercentage: number;
    reductionPercentage: number;
    penaltyRate: number;
    bonusRate: number;
    performanceBonus: boolean;
    safetyBonus: boolean;
  };
  
  // Extra Services
  extraServices: {
    diagnostics: {
      enabled: boolean;
      rate: number;
      included: number;
      extraRate: number;
    };
    tolls: {
      enabled: boolean;
      included: boolean;
      rate: number;
    };
    parking: {
      enabled: boolean;
      included: boolean;
      rate: number;
    };
    maintenance: {
      included: boolean;
      rate: number;
    };
    insurance: {
      included: boolean;
      rate: number;
    };
    cleaning: {
      included: boolean;
      rate: number;
    };
  };
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface ServiceRating {
  id: string;
  contractId: string;
  ratingPeriod: {
    startDate: string;
    endDate: string;
    type: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  };
  
  // Service Metrics
  metrics: {
    totalKm: number;
    totalHours: number;
    totalTrips: number;
    totalFuel: number;
    averageSpeed: number;
    fuelEfficiency: number;
    utilizationRate: number;
  };
  
  // Base Costs
  baseCosts: {
    fixedRateCost: number;
    perKmCost: number;
    perHourCost: number;
    driverCost: number;
    fuelCost: number;
    totalBaseCost: number;
  };
  
  // Extra Costs
  extraCosts: {
    extraKmCost: number;
    extraHourCost: number;
    extraFuelCost: number;
    diagnosticsCost: number;
    tollsCost: number;
    parkingCost: number;
    maintenanceCost: number;
    insuranceCost: number;
    cleaningCost: number;
    totalExtraCost: number;
  };
  
  // Deductions and Bonuses
  deductions: {
    retentionAmount: number;
    reductionAmount: number;
    penaltyAmount: number;
    totalDeductions: number;
  };
  
  bonuses: {
    performanceBonus: number;
    safetyBonus: number;
    totalBonuses: number;
  };
  
  // Final Calculation
  finalCalculation: {
    grossAmount: number;
    totalDeductions: number;
    totalBonuses: number;
    netAmount: number;
    currency: string;
  };
  
  // Status and Approval
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  paymentMethod?: 'BANK_TRANSFER' | 'PIX' | 'CHECK' | 'CASH';
  
  // Supporting Documents
  documents: RatingDocument[];
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface RatingDocument {
  id: string;
  type: 'INVOICE' | 'FUEL_RECEIPT' | 'TOLL_RECEIPT' | 'DIAGNOSTIC_REPORT' | 'TRIP_LOG' | 'TIMESHEET' | 'OTHER';
  name: string;
  description: string;
  url: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  amount?: number;
  date: string;
}

interface ExtraServiceCharge {
  id: string;
  ratingId: string;
  serviceType: 'DIAGNOSTIC' | 'TOLL' | 'PARKING' | 'MAINTENANCE' | 'INSURANCE' | 'CLEANING' | 'OTHER';
  description: string;
  date: string;
  amount: number;
  currency: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

interface ExtraTrip {
  id: string;
  ratingId: string;
  contractId: string;
  tripType: 'EXTRA_DELIVERY' | 'EXTRA_TRANSPORT' | 'EMERGENCY_TRIP' | 'SPECIAL_SERVICE';
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  date: string;
  startTime: string;
  endTime: string;
  clientName?: string;
  purpose: string;
  rate: number;
  rateType: 'PER_KM' | 'PER_HOUR' | 'FIXED';
  amount: number;
  currency: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
}

interface DriverCost {
  id: string;
  ratingId: string;
  contractId: string;
  driverId: string;
  driverName: string;
  costType: 'OVERTIME' | 'BONUS' | 'PENALTY' | 'EXPENSE' | 'OTHER';
  description: string;
  date: string;
  hours?: number;
  amount: number;
  currency: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

interface DriverPayment {
  id: string;
  ratingId: string;
  driverId: string;
  driverName: string;
  baseSalary: number;
  bonuses: {
    performanceBonus: number;
    safetyBonus: number;
    extraTripBonus: number;
    fuelEfficiencyBonus: number;
    totalBonus: number;
  };
  deductions: {
    retention: number;
    reduction: number;
    penalty: number;
    totalDeductions: number;
  };
  netPayment: number;
  paymentDate: string;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  paymentMethod?: string;
  createdAt: string;
}

interface ServiceRatingFilter {
  contractId?: string;
  clientId?: string;
  vehicleId?: string;
  driverId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  serviceType?: string;
  search?: string;
}

interface ServiceRatingStats {
  total: number;
  byStatus: Record<string, number>;
  byServiceType: Record<string, number>;
  totalRevenue: number;
  totalCosts: number;
  profitMargin: number;
  averageRating: number;
  totalKm: number;
  totalFuel: number;
  averageFuelEfficiency: number;
  utilizationRate: number;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    costs: number;
    profit: number;
    km: number;
    fuel: number;
    trips: number;
  }>;
}

class ServiceRatingService {
  private static instance: ServiceRatingService;
  private contracts: ServiceContract[] = [];
  private ratings: ServiceRating[] = [];
  private extraCharges: ExtraServiceCharge[] = [];
  private extraTrips: ExtraTrip[] = [];
  private driverCosts: DriverCost[] = [];
  private driverPayments: DriverPayment[] = [];

  private constructor() {
    this.initializeData();
  }

  static getInstance(): ServiceRatingService {
    if (!ServiceRatingService.instance) {
      ServiceRatingService.instance = new ServiceRatingService();
    }
    return ServiceRatingService.instance;
  }

  private initializeData() {
    // Initialize sample contracts
    this.contracts = [
      {
        id: 'contract-001',
        contractNumber: 'CTR-2024-001',
        clientName: 'Transportadora Rápido Express',
        clientId: 'client-001',
        vehicleId: 'veh-001',
        vehiclePlate: 'ABC-1234',
        vehicleModel: 'Mercedes-Benz Sprinter 2022',
        serviceType: 'TRANSPORT',
        contractType: 'HYBRID',
        status: 'ACTIVE',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        billingCycle: 'MONTHLY',
        baseRates: {
          fixedRate: 5000,
          perKmRate: 2.50,
          perHourRate: 50,
          fuelRate: 6.50,
          driverRate: 3500,
          currency: 'BRL'
        },
        limits: {
          maxKmPerMonth: 5000,
          maxHoursPerMonth: 200,
          maxFuelPerMonth: 800,
          includedKm: 3000,
          includedHours: 160,
          includedFuel: 600,
          extraKmRate: 3.50,
          extraHourRate: 60,
          extraFuelRate: 7.50
        },
        deductions: {
          retentionPercentage: 5,
          reductionPercentage: 3,
          penaltyRate: 10,
          bonusRate: 15,
          performanceBonus: true,
          safetyBonus: true
        },
        extraServices: {
          diagnostics: {
            enabled: true,
            rate: 150,
            included: 1,
            extraRate: 200
          },
          tolls: {
            enabled: true,
            included: false,
            rate: 0
          },
          parking: {
            enabled: true,
            included: false,
            rate: 25
          },
          maintenance: {
            included: true,
            rate: 300
          },
          insurance: {
            included: true,
            rate: 200
          },
          cleaning: {
            included: false,
            rate: 50
          }
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin'
      },
      {
        id: 'contract-002',
        contractNumber: 'CTR-2024-002',
        clientName: 'Logística Urbana S/A',
        clientId: 'client-002',
        vehicleId: 'veh-002',
        vehiclePlate: 'DEF-5678',
        vehicleModel: 'Volkswagen Constellation 2021',
        serviceType: 'LOGISTICS',
        contractType: 'PER_KM',
        status: 'ACTIVE',
        startDate: '2024-02-01',
        endDate: '2025-01-31',
        billingCycle: 'MONTHLY',
        baseRates: {
          fixedRate: 0,
          perKmRate: 4.20,
          perHourRate: 0,
          fuelRate: 6.80,
          driverRate: 3200,
          currency: 'BRL'
        },
        limits: {
          maxKmPerMonth: 8000,
          maxHoursPerMonth: 220,
          maxFuelPerMonth: 1200,
          includedKm: 0,
          includedHours: 0,
          includedFuel: 0,
          extraKmRate: 4.20,
          extraHourRate: 0,
          extraFuelRate: 6.80
        },
        deductions: {
          retentionPercentage: 8,
          reductionPercentage: 5,
          penaltyRate: 15,
          bonusRate: 12,
          performanceBonus: true,
          safetyBonus: true
        },
        extraServices: {
          diagnostics: {
            enabled: true,
            rate: 200,
            included: 0,
            extraRate: 200
          },
          tolls: {
            enabled: true,
            included: false,
            rate: 0
          },
          parking: {
            enabled: true,
            included: false,
            rate: 30
          },
          maintenance: {
            included: false,
            rate: 400
          },
          insurance: {
            included: true,
            rate: 250
          },
          cleaning: {
            included: false,
            rate: 75
          }
        },
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin'
      }
    ];

    // Initialize sample ratings
    this.ratings = [
      {
        id: 'rating-001',
        contractId: 'contract-001',
        ratingPeriod: {
          startDate: '2024-04-01',
          endDate: '2024-04-30',
          type: 'MONTHLY'
        },
        metrics: {
          totalKm: 4500,
          totalHours: 180,
          totalTrips: 45,
          totalFuel: 650,
          averageSpeed: 25,
          fuelEfficiency: 6.92,
          utilizationRate: 85
        },
        baseCosts: {
          fixedRateCost: 5000,
          perKmCost: 11250,
          perHourCost: 9000,
          driverCost: 3500,
          fuelCost: 4225,
          totalBaseCost: 33975
        },
        extraCosts: {
          extraKmCost: 5250,
          extraHourCost: 1200,
          extraFuelCost: 375,
          diagnosticsCost: 200,
          tollsCost: 450,
          parkingCost: 150,
          maintenanceCost: 0,
          insuranceCost: 200,
          cleaningCost: 75,
          totalExtraCost: 7900
        },
        deductions: {
          retentionAmount: 2093.75,
          reductionAmount: 1256.25,
          penaltyAmount: 0,
          totalDeductions: 3350
        },
        bonuses: {
          performanceBonus: 5096.25,
          safetyBonus: 1698.75,
          totalBonuses: 6795
        },
        finalCalculation: {
          grossAmount: 41875,
          totalDeductions: 3350,
          totalBonuses: 6795,
          netAmount: 45320,
          currency: 'BRL'
        },
        status: 'APPROVED',
        approvedBy: 'manager-001',
        approvedAt: '2024-05-05T10:30:00Z',
        paidAt: '2024-05-10T14:00:00Z',
        paymentMethod: 'BANK_TRANSFER',
        documents: [],
        createdAt: '2024-05-01T00:00:00Z',
        updatedAt: '2024-05-05T10:30:00Z',
        createdBy: 'operator-001',
        updatedBy: 'manager-001'
      }
    ];

    // Initialize sample extra charges
    this.extraCharges = [
      {
        id: 'charge-001',
        ratingId: 'rating-001',
        serviceType: 'DIAGNOSTIC',
        description: 'Diagnóstico eletrônico completo',
        date: '2024-04-15',
        amount: 200,
        currency: 'BRL',
        approved: true,
        approvedBy: 'manager-001',
        approvedAt: '2024-04-16T09:00:00Z',
        receiptUrl: '/uploads/diagnostic-001.pdf',
        notes: 'Verificação de sistema elétrico e injeção eletrônica',
        createdAt: '2024-04-15T14:30:00Z'
      },
      {
        id: 'charge-002',
        ratingId: 'rating-001',
        serviceType: 'TOLL',
        description: 'Pedágios Rodovia Anhanguera',
        date: '2024-04-20',
        amount: 450,
        currency: 'BRL',
        approved: true,
        approvedBy: 'manager-001',
        approvedAt: '2024-04-21T10:00:00Z',
        notes: 'Pedágios registrados no mês',
        createdAt: '2024-04-20T16:45:00Z'
      }
    ];

    // Initialize sample driver payments
    this.driverPayments = [
      {
        id: 'payment-001',
        ratingId: 'rating-001',
        driverId: 'driver-001',
        driverName: 'João Silva',
        baseSalary: 3500,
        bonuses: {
          performanceBonus: 5096.25,
          safetyBonus: 1698.75,
          extraTripBonus: 500,
          fuelEfficiencyBonus: 300,
          totalBonus: 7595
        },
        deductions: {
          retention: 174.75,
          reduction: 105,
          penalty: 0,
          totalDeductions: 279.75
        },
        netPayment: 10815.25,
        paymentDate: '2024-05-05',
        status: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        createdAt: '2024-05-01T00:00:00Z'
      }
    ];

    // Initialize sample extra trips
    this.extraTrips = [
      {
        id: 'trip-001',
        ratingId: 'rating-001',
        contractId: 'contract-001',
        tripType: 'EXTRA_DELIVERY',
        origin: 'Centro de Distribuição A',
        destination: 'Cliente Industrial B',
        distance: 45,
        duration: 90,
        date: '2024-04-10',
        startTime: '14:00',
        endTime: '15:30',
        clientName: 'Indústria XYZ Ltda',
        purpose: 'Entrega emergencial de peças',
        rate: 3.50,
        rateType: 'PER_KM',
        amount: 157.50,
        currency: 'BRL',
        approved: true,
        approvedBy: 'manager-001',
        approvedAt: '2024-04-11T08:00:00Z',
        notes: 'Viagem fora do horário normal',
        createdAt: '2024-04-10T16:00:00Z'
      },
      {
        id: 'trip-002',
        ratingId: 'rating-001',
        contractId: 'contract-001',
        tripType: 'EMERGENCY_TRIP',
        origin: 'Base Operacional',
        destination: 'Hospital Municipal',
        distance: 12,
        duration: 30,
        date: '2024-04-15',
        startTime: '22:30',
        endTime: '23:00',
        clientName: 'Prefeitura Municipal',
        purpose: 'Transporte de material médico urgente',
        rate: 150,
        rateType: 'FIXED',
        amount: 150,
        currency: 'BRL',
        approved: true,
        approvedBy: 'manager-001',
        approvedAt: '2024-04-16T09:00:00Z',
        notes: 'Viagem noturna com adicional de urgência',
        createdAt: '2024-04-15T23:30:00Z'
      }
    ];

    // Initialize sample driver costs
    this.driverCosts = [
      {
        id: 'cost-001',
        ratingId: 'rating-001',
        contractId: 'contract-001',
        driverId: 'driver-001',
        driverName: 'João Silva',
        costType: 'OVERTIME',
        description: 'Horas extras - viagem noturna',
        date: '2024-04-15',
        hours: 2,
        amount: 120,
        currency: 'BRL',
        approved: true,
        approvedBy: 'manager-001',
        approvedAt: '2024-04-16T08:30:00Z',
        notes: '2 horas extras com adicional noturno',
        createdAt: '2024-04-15T23:00:00Z'
      },
      {
        id: 'cost-002',
        ratingId: 'rating-001',
        contractId: 'contract-001',
        driverId: 'driver-001',
        driverName: 'João Silva',
        costType: 'BONUS',
        description: 'Bônus por desempenho em entregas',
        date: '2024-04-30',
        amount: 300,
        currency: 'BRL',
        approved: true,
        approvedBy: 'manager-001',
        approvedAt: '2024-05-01T10:00:00Z',
        notes: 'Bônus por cumprimento de metas mensais',
        createdAt: '2024-04-30T16:00:00Z'
      },
      {
        id: 'cost-003',
        ratingId: 'rating-001',
        contractId: 'contract-001',
        driverId: 'driver-001',
        driverName: 'João Silva',
        costType: 'EXPENSE',
        description: 'Reembolso de alimentação',
        date: '2024-04-20',
        amount: 85,
        currency: 'BRL',
        approved: true,
        approvedBy: 'manager-001',
        approvedAt: '2024-04-21T09:00:00Z',
        receiptUrl: '/uploads/receipt-001.jpg',
        notes: 'Refeições durante viagem longa',
        createdAt: '2024-04-20T18:00:00Z'
      }
    ];
  }

  // Contract Management
  async getAllContracts(): Promise<ServiceContract[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve([...this.contracts]), 300);
    });
  }

  async getContractById(id: string): Promise<ServiceContract | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const contract = this.contracts.find(c => c.id === id);
        resolve(contract || null);
      }, 200);
    });
  }

  async getContractsByClient(clientId: string): Promise<ServiceContract[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const clientContracts = this.contracts.filter(c => c.clientId === clientId);
        resolve(clientContracts);
      }, 200);
    });
  }

  async createContract(contractData: Omit<ServiceContract, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<ServiceContract> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newContract: ServiceContract = {
          ...contractData,
          id: `contract-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user',
          updatedBy: 'current-user'
        };

        this.contracts.push(newContract);
        resolve(newContract);
      }, 500);
    });
  }

  async updateContract(id: string, updates: Partial<ServiceContract>): Promise<ServiceContract> {
    return new Promise(resolve => {
      setTimeout(() => {
        const contractIndex = this.contracts.findIndex(c => c.id === id);
        if (contractIndex === -1) {
          throw new Error('Contrato não encontrado');
        }

        this.contracts[contractIndex] = {
          ...this.contracts[contractIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy: 'current-user'
        };

        resolve(this.contracts[contractIndex]);
      }, 500);
    });
  }

  async deleteContract(id: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const contractIndex = this.contracts.findIndex(c => c.id === id);
        if (contractIndex === -1) {
          throw new Error('Contrato não encontrado');
        }

        this.contracts.splice(contractIndex, 1);
        resolve();
      }, 300);
    });
  }

  // Rating Management
  async getAllRatings(filter?: ServiceRatingFilter): Promise<ServiceRating[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        let filteredRatings = [...this.ratings];

        if (filter) {
          if (filter.contractId) {
            filteredRatings = filteredRatings.filter(r => r.contractId === filter.contractId);
          }
          if (filter.clientId) {
            filteredRatings = filteredRatings.filter(r => {
              const contract = this.contracts.find(c => c.id === r.contractId);
              return contract && contract.clientId === filter.clientId;
            });
          }
          if (filter.status) {
            filteredRatings = filteredRatings.filter(r => r.status === filter.status);
          }
          if (filter.dateFrom) {
            filteredRatings = filteredRatings.filter(r => 
              new Date(r.ratingPeriod.startDate) >= new Date(filter.dateFrom)
            );
          }
          if (filter.dateTo) {
            filteredRatings = filteredRatings.filter(r => 
              new Date(r.ratingPeriod.endDate) <= new Date(filter.dateTo)
            );
          }
          if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            filteredRatings = filteredRatings.filter(r => {
              const contract = this.contracts.find(c => c.id === r.contractId);
              return contract && (
                contract.contractNumber.toLowerCase().includes(searchLower) ||
                contract.clientName.toLowerCase().includes(searchLower) ||
                contract.vehiclePlate.toLowerCase().includes(searchLower)
              );
            });
          }
        }

        resolve(filteredRatings);
      }, 300);
    });
  }

  async getRatingById(id: string): Promise<ServiceRating | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const rating = this.ratings.find(r => r.id === id);
        resolve(rating || null);
      }, 200);
    });
  }

  async createRating(ratingData: Omit<ServiceRating, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<ServiceRating> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newRating: ServiceRating = {
          ...ratingData,
          id: `rating-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user',
          updatedBy: 'current-user'
        };

        this.ratings.push(newRating);
        resolve(newRating);
      }, 500);
    });
  }

  async updateRating(id: string, updates: Partial<ServiceRating>): Promise<ServiceRating> {
    return new Promise(resolve => {
      setTimeout(() => {
        const ratingIndex = this.ratings.findIndex(r => r.id === id);
        if (ratingIndex === -1) {
          throw new Error('Rateio não encontrado');
        }

        this.ratings[ratingIndex] = {
          ...this.ratings[ratingIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy: 'current-user'
        };

        resolve(this.ratings[ratingIndex]);
      }, 500);
    });
  }

  async deleteRating(id: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const ratingIndex = this.ratings.findIndex(r => r.id === id);
        if (ratingIndex === -1) {
          throw new Error('Rateio não encontrado');
        }

        this.ratings.splice(ratingIndex, 1);
        resolve();
      }, 300);
    });
  }

  // Extra Charges Management
  async getExtraChargesByRating(ratingId: string): Promise<ExtraServiceCharge[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const charges = this.extraCharges.filter(c => c.ratingId === ratingId);
        resolve(charges);
      }, 200);
    });
  }

  async createExtraCharge(chargeData: Omit<ExtraServiceCharge, 'id' | 'createdAt'>): Promise<ExtraServiceCharge> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newCharge: ExtraServiceCharge = {
          ...chargeData,
          id: `charge-${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        this.extraCharges.push(newCharge);
        resolve(newCharge);
      }, 500);
    });
  }

  // Extra Trips Management
  async getExtraTripsByRating(ratingId: string): Promise<ExtraTrip[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const trips = this.extraTrips.filter(t => t.ratingId === ratingId);
        resolve(trips);
      }, 200);
    });
  }

  async createExtraTrip(tripData: Omit<ExtraTrip, 'id' | 'createdAt'>): Promise<ExtraTrip> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newTrip: ExtraTrip = {
          ...tripData,
          id: `trip-${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        this.extraTrips.push(newTrip);
        resolve(newTrip);
      }, 500);
    });
  }

  async updateExtraTrip(id: string, updates: Partial<ExtraTrip>): Promise<ExtraTrip> {
    return new Promise(resolve => {
      setTimeout(() => {
        const tripIndex = this.extraTrips.findIndex(t => t.id === id);
        if (tripIndex === -1) {
          throw new Error('Viagem extra não encontrada');
        }

        this.extraTrips[tripIndex] = {
          ...this.extraTrips[tripIndex],
          ...updates
        };

        resolve(this.extraTrips[tripIndex]);
      }, 500);
    });
  }

  async deleteExtraTrip(id: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const tripIndex = this.extraTrips.findIndex(t => t.id === id);
        if (tripIndex === -1) {
          throw new Error('Viagem extra não encontrada');
        }

        this.extraTrips.splice(tripIndex, 1);
        resolve();
      }, 300);
    });
  }

  // Driver Costs Management
  async getDriverCostsByRating(ratingId: string): Promise<DriverCost[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const costs = this.driverCosts.filter(c => c.ratingId === ratingId);
        resolve(costs);
      }, 200);
    });
  }

  async createDriverCost(costData: Omit<DriverCost, 'id' | 'createdAt'>): Promise<DriverCost> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newCost: DriverCost = {
          ...costData,
          id: `cost-${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        this.driverCosts.push(newCost);
        resolve(newCost);
      }, 500);
    });
  }

  async updateDriverCost(id: string, updates: Partial<DriverCost>): Promise<DriverCost> {
    return new Promise(resolve => {
      setTimeout(() => {
        const costIndex = this.driverCosts.findIndex(c => c.id === id);
        if (costIndex === -1) {
          throw new Error('Custo do motorista não encontrado');
        }

        this.driverCosts[costIndex] = {
          ...this.driverCosts[costIndex],
          ...updates
        };

        resolve(this.driverCosts[costIndex]);
      }, 500);
    });
  }

  async deleteDriverCost(id: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const costIndex = this.driverCosts.findIndex(c => c.id === id);
        if (costIndex === -1) {
          throw new Error('Custo do motorista não encontrado');
        }

        this.driverCosts.splice(costIndex, 1);
        resolve();
      }, 300);
    });
  }

  async getDriverPaymentsByRating(ratingId: string): Promise<DriverPayment[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const payments = this.driverPayments.filter(p => p.ratingId === ratingId);
        resolve(payments);
      }, 200);
    });
  }

  async calculateRating(contractId: string, metrics: ServiceRating['metrics'], period: ServiceRating['ratingPeriod']): Promise<ServiceRating> {
    return new Promise(resolve => {
      setTimeout(() => {
        const contract = this.contracts.find(c => c.id === contractId);
        if (!contract) {
          throw new Error('Contrato não encontrado');
        }

        // Calculate base costs
        const baseCosts = {
          fixedRateCost: contract.baseRates.fixedRate,
          perKmCost: metrics.totalKm * contract.baseRates.perKmRate,
          perHourCost: metrics.totalHours * contract.baseRates.perHourRate,
          driverCost: contract.baseRates.driverRate,
          fuelCost: metrics.totalFuel * contract.baseRates.fuelRate,
          totalBaseCost: 0
        };
        baseCosts.totalBaseCost = baseCosts.fixedRateCost + baseCosts.perKmCost + baseCosts.perHourCost + baseCosts.driverCost + baseCosts.fuelCost;

        // Calculate extra costs
        const extraKm = Math.max(0, metrics.totalKm - contract.limits.includedKm);
        const extraHours = Math.max(0, metrics.totalHours - contract.limits.includedHours);
        const extraFuel = Math.max(0, metrics.totalFuel - contract.limits.includedFuel);

        const extraCosts = {
          extraKmCost: extraKm * contract.limits.extraKmRate,
          extraHourCost: extraHours * contract.limits.extraHourRate,
          extraFuelCost: extraFuel * contract.limits.extraFuelRate,
          diagnosticsCost: contract.extraServices.diagnostics.enabled ? 
            Math.max(0, 1 - contract.extraServices.diagnostics.included) * contract.extraServices.diagnostics.extraRate : 0,
          tollsCost: contract.extraServices.tolls.enabled ? 450 : 0,
          parkingCost: contract.extraServices.parking.enabled ? 150 : 0,
          maintenanceCost: contract.extraServices.maintenance.included ? 0 : contract.extraServices.maintenance.rate,
          insuranceCost: contract.extraServices.insurance.included ? 0 : contract.extraServices.insurance.rate,
          cleaningCost: contract.extraServices.cleaning.included ? 0 : contract.extraServices.cleaning.rate,
          totalExtraCost: 0
        };
        extraCosts.totalExtraCost = extraCosts.extraKmCost + extraCosts.extraHourCost + extraCosts.extraFuelCost + 
                                   extraCosts.diagnosticsCost + extraCosts.tollsCost + extraCosts.parkingCost + 
                                   extraCosts.maintenanceCost + extraCosts.insuranceCost + extraCosts.cleaningCost;

        // Calculate deductions
        const grossAmount = baseCosts.totalBaseCost + extraCosts.totalExtraCost;
        const deductions = {
          retentionAmount: grossAmount * (contract.deductions.retentionPercentage / 100),
          reductionAmount: grossAmount * (contract.deductions.reductionPercentage / 100),
          penaltyAmount: 0,
          totalDeductions: 0
        };
        deductions.totalDeductions = deductions.retentionAmount + deductions.reductionAmount + deductions.penaltyAmount;

        // Calculate bonuses
        const bonuses = {
          performanceBonus: contract.deductions.performanceBonus ? grossAmount * (contract.deductions.bonusRate / 100) : 0,
          safetyBonus: contract.deductions.safetyBonus ? 1000 : 0,
          totalBonuses: 0
        };
        bonuses.totalBonuses = bonuses.performanceBonus + bonuses.safetyBonus;

        // Final calculation
        const finalCalculation = {
          grossAmount,
          totalDeductions: deductions.totalDeductions,
          totalBonuses: bonuses.totalBonuses,
          netAmount: grossAmount - deductions.totalDeductions + bonuses.totalBonuses,
          currency: contract.baseRates.currency
        };

        const newRating: ServiceRating = {
          id: `rating-${Date.now()}`,
          contractId,
          ratingPeriod: period,
          metrics,
          baseCosts,
          extraCosts,
          deductions,
          bonuses,
          finalCalculation,
          status: 'DRAFT',
          documents: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user',
          updatedBy: 'current-user'
        };

        resolve(newRating);
      }, 1000);
    });
  }

  // Statistics
  async getRatingStats(filter?: ServiceRatingFilter): Promise<ServiceRatingStats> {
    return new Promise(resolve => {
      setTimeout(() => {
        const filteredRatings = filter 
          ? this.ratings.filter(r => {
            if (filter.dateFrom && new Date(r.ratingPeriod.startDate) < new Date(filter.dateFrom)) return false;
            if (filter.dateTo && new Date(r.ratingPeriod.endDate) > new Date(filter.dateTo)) return false;
            return true;
          })
          : this.ratings;

        const stats: ServiceRatingStats = {
          total: filteredRatings.length,
          byStatus: {},
          byServiceType: {},
          totalRevenue: filteredRatings.reduce((sum, r) => sum + r.finalCalculation.grossAmount, 0),
          totalCosts: filteredRatings.reduce((sum, r) => sum + r.baseCosts.totalBaseCost + r.extraCosts.totalExtraCost, 0),
          profitMargin: 0,
          averageRating: 4.5,
          totalKm: filteredRatings.reduce((sum, r) => sum + r.metrics.totalKm, 0),
          totalFuel: filteredRatings.reduce((sum, r) => sum + r.metrics.totalFuel, 0),
          averageFuelEfficiency: 0,
          utilizationRate: 0,
          monthlyTrends: [
            { month: '2024-01', revenue: 45000, costs: 35000, profit: 10000, km: 12000, fuel: 1800, trips: 45 },
            { month: '2024-02', revenue: 48000, costs: 37000, profit: 11000, km: 13500, fuel: 1950, trips: 48 },
            { month: '2024-03', revenue: 52000, costs: 39000, profit: 13000, km: 14200, fuel: 2100, trips: 52 },
            { month: '2024-04', revenue: 49000, costs: 38000, profit: 11000, km: 13800, fuel: 2050, trips: 50 }
          ]
        };

        // Calculate by status
        filteredRatings.forEach(rating => {
          stats.byStatus[rating.status] = (stats.byStatus[rating.status] || 0) + 1;
        });

        // Calculate profit margin
        stats.profitMargin = stats.totalRevenue > 0 ? ((stats.totalRevenue - stats.totalCosts) / stats.totalRevenue) * 100 : 0;

        // Calculate average fuel efficiency
        stats.averageFuelEfficiency = stats.totalKm > 0 ? stats.totalKm / stats.totalFuel : 0;

        resolve(stats);
      }, 400);
    });
  }

  // Utility Methods
  getContractTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'FIXED_RATE': 'Taxa Fixa',
      'PER_KM': 'Por Quilômetro',
      'PER_HOUR': 'Por Hora',
      'HYBRID': 'Híbrido',
      'MILEAGE_BASED': 'Baseado em Quilometragem'
    };
    return labels[type] || type;
  }

  getServiceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'TRANSPORT': 'Transporte',
      'LOGISTICS': 'Logística',
      'DISTRIBUTION': 'Distribuição',
      'SHUTTLE': 'Shuttle',
      'DELIVERY': 'Entrega',
      'OTHER': 'Outro'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Ativo',
      'SUSPENDED': 'Suspenso',
      'TERMINATED': 'Encerrado',
      'PENDING': 'Pendente'
    };
    return labels[status] || status;
  }

  getRatingStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'DRAFT': 'Rascunho',
      'PENDING': 'Pendente',
      'APPROVED': 'Aprovado',
      'REJECTED': 'Rejeitado',
      'PAID': 'Pago'
    };
    return labels[status] || status;
  };
}

export default ServiceRatingService.getInstance();
