interface DamageReport {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  reportDate: string;
  reportedBy: string;
  reporterRole: 'DRIVER' | 'MECHANIC' | 'SUPERVISOR' | 'ADMIN';
  reportType: 'ACCIDENT' | 'VANDALISM' | 'WEAR' | 'MALFUNCTION' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
  location: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    odometer: number;
  };
  description: {
    title: string;
    details: string;
    cause: string;
    immediateAction: string;
  };
  damageAreas: DamageArea[];
  estimatedCosts: {
    labor: number;
    parts: number;
    materials: number;
    total: number;
    currency: string;
  };
  timeline: DamageEvent[];
  documents: DamageDocument[];
  responsible: {
    driverId?: string;
    driverName?: string;
    thirdPartyInvolved: boolean;
    thirdPartyInfo?: {
      name: string;
      contact: string;
      insurance: string;
      vehicle: string;
      licensePlate: string;
    };
  };
  insurance: {
    claimFiled: boolean;
    claimNumber?: string;
    claimStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING';
    insuranceCompany: string;
    policyNumber: string;
    deductible: number;
    coverageAmount: number;
  };
  repair: {
    assignedTo?: string;
    assignedToName?: string;
    estimatedCompletionDate?: string;
    actualCompletionDate?: string;
    repairNotes: string;
    partsUsed: RepairPart[];
    laborHours: number;
    warrantyInfo?: {
      warrantyPeriod: number;
      warrantyExpiry: string;
      coveredUnderWarranty: boolean;
    };
  };
  approval: {
    requiresApproval: boolean;
    approvedBy?: string;
    approvedAt?: string;
    approvalNotes?: string;
    budgetApproved: boolean;
    budgetApprovedBy?: string;
    budgetApprovedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface DamageArea {
  id: string;
  area: 'FRONT' | 'REAR' | 'LEFT_SIDE' | 'RIGHT_SIDE' | 'ROOF' | 'UNDERCARRIAGE' | 'INTERIOR' | 'ENGINE' | 'TRANSMISSION' | 'BRAKES' | 'SUSPENSION' | 'ELECTRICAL' | 'TIRES' | 'GLASS' | 'LIGHTS' | 'MIRRORS' | 'OTHER';
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'SEVERE';
  description: string;
  estimatedRepairCost: number;
  requiresReplacement: boolean;
  partsNeeded?: string[];
  images: string[];
  repairMethod: 'REPAIR' | 'REPLACE' | 'REFURBISH' | 'PAINT' | 'ADJUST';
}

interface DamageEvent {
  id: string;
  eventType: 'DAMAGE_OCCURRED' | 'REPORTED' | 'INSPECTED' | 'REPAIR_STARTED' | 'REPAIR_COMPLETED' | 'APPROVED' | 'CLOSED';
  timestamp: string;
  description: string;
  reportedBy: string;
  attachments?: string[];
}

interface DamageDocument {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'REPORT' | 'INVOICE' | 'INSURANCE_CLAIM' | 'POLICE_REPORT' | 'WITNESS_STATEMENT' | 'OTHER';
  name: string;
  description: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number;
  mimeType: string;
}

interface RepairPart {
  id: string;
  partNumber: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier: string;
  warrantyPeriod?: number;
  inStock: boolean;
  orderedAt?: string;
  receivedAt?: string;
}

interface DamageReportFilter {
  vehicleId?: string;
  status?: string;
  severity?: string;
  reportType?: string;
  dateFrom?: string;
  dateTo?: string;
  reportedBy?: string;
  search?: string;
}

interface DamageReportStats {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  totalCost: number;
  averageResolutionTime: number;
  openReports: number;
  criticalReports: number;
  monthlyTrend: Array<{
    month: string;
    count: number;
    cost: number;
  }>;
}

class DamageReportService {
  private static instance: DamageReportService;
  private reports: DamageReport[] = [];

  private constructor() {
    this.initializeData();
  }

  static getInstance(): DamageReportService {
    if (!DamageReportService.instance) {
      DamageReportService.instance = new DamageReportService();
    }
    return DamageReportService.instance;
  }

  private initializeData() {
    // Initialize with sample damage reports
    this.reports = [
      {
        id: 'damage-001',
        vehicleId: 'veh-001',
        vehiclePlate: 'ABC-1234',
        vehicleModel: 'Mercedes-Benz Sprinter 2022',
        reportDate: '2024-04-15T10:30:00Z',
        reportedBy: 'João Silva',
        reporterRole: 'DRIVER',
        reportType: 'ACCIDENT',
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        location: {
          address: 'Av. Paulista, 1000 - São Paulo, SP',
          coordinates: { latitude: -23.563311, longitude: -46.652743 },
          odometer: 45230
        },
        description: {
          title: 'Colisão traseira em semáforo',
          details: 'Veículo foi atingido por trás durante parada no semáforo. Para-choque traseiro e tampa do porta-malas danificados.',
          cause: 'Motorista terceiro não freou a tempo',
          immediateAction: 'Veículo foi removido da via e documentado com fotos. Polícia foi acionada.'
        },
        damageAreas: [
          {
            id: 'area-001',
            area: 'REAR',
            severity: 'MAJOR',
            description: 'Para-choque traseiro com rachaduras e deformação',
            estimatedRepairCost: 2500,
            requiresReplacement: true,
            partsNeeded: ['Para-choque traseiro', 'Sensores de estacionamento'],
            images: ['damage-001-rear-1.jpg', 'damage-001-rear-2.jpg'],
            repairMethod: 'REPLACE'
          },
          {
            id: 'area-002',
            area: 'REAR',
            severity: 'MODERATE',
            description: 'Tampa do porta-malas amassada',
            estimatedRepairCost: 800,
            requiresReplacement: false,
            partsNeeded: [],
            images: ['damage-001-trunk-1.jpg'],
            repairMethod: 'REPAIR'
          }
        ],
        estimatedCosts: {
          labor: 1200,
          parts: 2100,
          materials: 300,
          total: 3600,
          currency: 'BRL'
        },
        timeline: [
          {
            id: 'event-001',
            eventType: 'DAMAGE_OCCURRED',
            timestamp: '2024-04-15T08:15:00Z',
            description: 'Colisão ocorreu no cruzamento da Av. Paulista com Rua Augusta',
            reportedBy: 'João Silva'
          },
          {
            id: 'event-002',
            eventType: 'REPORTED',
            timestamp: '2024-04-15T10:30:00Z',
            description: 'Relato registrado no sistema',
            reportedBy: 'João Silva'
          },
          {
            id: 'event-003',
            eventType: 'INSPECTED',
            timestamp: '2024-04-15T14:00:00Z',
            description: 'Inspeção inicial realizada pelo mecânico',
            reportedBy: 'Carlos Mendes'
          }
        ],
        documents: [
          {
            id: 'doc-001',
            type: 'PHOTO',
            name: 'Foto do dano traseiro',
            description: 'Foto mostrando o para-choque danificado',
            url: '/uploads/damage-001-photo-1.jpg',
            uploadedAt: '2024-04-15T10:35:00Z',
            uploadedBy: 'João Silva',
            fileSize: 2048576,
            mimeType: 'image/jpeg'
          },
          {
            id: 'doc-002',
            type: 'POLICE_REPORT',
            name: 'Boletim de ocorrência',
            description: 'BO registrado na delegacia',
            url: '/uploads/damage-001-bo.pdf',
            uploadedAt: '2024-04-15T11:00:00Z',
            uploadedBy: 'João Silva',
            fileSize: 1048576,
            mimeType: 'application/pdf'
          }
        ],
        responsible: {
          driverId: 'driver-001',
          driverName: 'João Silva',
          thirdPartyInvolved: true,
          thirdPartyInfo: {
            name: 'Maria Santos',
            contact: '(11) 98765-4321',
            insurance: 'Porto Seguro',
            vehicle: 'Volkswagen Gol',
            licensePlate: 'XYZ-9876'
          }
        },
        insurance: {
          claimFiled: true,
          claimNumber: 'CLAIM-2024-001',
          claimStatus: 'PROCESSING',
          insuranceCompany: 'Porto Seguro',
          policyNumber: 'POL-001234567',
          deductible: 500,
          coverageAmount: 10000
        },
        repair: {
          assignedTo: 'mech-001',
          assignedToName: 'Carlos Mendes',
          estimatedCompletionDate: '2024-04-25T00:00:00Z',
          repairNotes: 'Aguardando peças do fornecedor. Reparo programado para início em 22/04.',
          partsUsed: [],
          laborHours: 8
        },
        approval: {
          requiresApproval: true,
          approvedBy: 'sup-001',
          approvedAt: '2024-04-15T16:00:00Z',
          approvalNotes: 'Orçamento aprovado. Autorizar início dos reparos.',
          budgetApproved: true,
          budgetApprovedBy: 'finance-001',
          budgetApprovedAt: '2024-04-15T16:30:00Z'
        },
        createdAt: '2024-04-15T10:30:00Z',
        updatedAt: '2024-04-15T16:30:00Z',
        createdBy: 'driver-001',
        updatedBy: 'finance-001'
      },
      {
        id: 'damage-002',
        vehicleId: 'veh-002',
        vehiclePlate: 'DEF-5678',
        vehicleModel: 'Volkswagen Constellation 2021',
        reportDate: '2024-04-18T14:20:00Z',
        reportedBy: 'Pedro Costa',
        reporterRole: 'DRIVER',
        reportType: 'WEAR',
        severity: 'MEDIUM',
        status: 'OPEN',
        location: {
          address: 'Rodovia Anhanguera, km 250 - Campinas, SP',
          odometer: 78450
        },
        description: {
          title: 'Desgaste excessivo dos pneus',
          details: 'Pneus dianteiros apresentando desgaste irregular e bolhas. Necessária substituição urgente.',
          cause: 'Uso intenso em estradas irregulares',
          immediateAction: 'Veículo parado em local seguro aguardando troca dos pneus.'
        },
        damageAreas: [
          {
            id: 'area-003',
            area: 'TIRES',
            severity: 'SEVERE',
            description: 'Pneu dianteiro esquerdo com bolha e desgaste irregular',
            estimatedRepairCost: 800,
            requiresReplacement: true,
            partsNeeded: ['Pneu 295/80R22.5'],
            images: ['damage-002-tire-1.jpg'],
            repairMethod: 'REPLACE'
          },
          {
            id: 'area-004',
            area: 'TIRES',
            severity: 'MODERATE',
            description: 'Pneu dianteiro direito com desgaste irregular',
            estimatedRepairCost: 750,
            requiresReplacement: true,
            partsNeeded: ['Pneu 295/80R22.5'],
            images: ['damage-002-tire-2.jpg'],
            repairMethod: 'REPLACE'
          }
        ],
        estimatedCosts: {
          labor: 200,
          parts: 1550,
          materials: 50,
          total: 1800,
          currency: 'BRL'
        },
        timeline: [
          {
            id: 'event-004',
            eventType: 'DAMAGE_OCCURRED',
            timestamp: '2024-04-18T13:45:00Z',
            description: 'Motorista percebeu anomalia nos pneus durante parada',
            reportedBy: 'Pedro Costa'
          },
          {
            id: 'event-005',
            eventType: 'REPORTED',
            timestamp: '2024-04-18T14:20:00Z',
            description: 'Relato registrado no sistema',
            reportedBy: 'Pedro Costa'
          }
        ],
        documents: [
          {
            id: 'doc-003',
            type: 'PHOTO',
            name: 'Foto do pneu danificado',
            description: 'Foto mostrando a bolha no pneu',
            url: '/uploads/damage-002-tire-damage.jpg',
            uploadedAt: '2024-04-18T14:25:00Z',
            uploadedBy: 'Pedro Costa',
            fileSize: 1536000,
            mimeType: 'image/jpeg'
          }
        ],
        responsible: {
          driverId: 'driver-002',
          driverName: 'Pedro Costa',
          thirdPartyInvolved: false
        },
        insurance: {
          claimFiled: false,
          claimStatus: 'PENDING',
          insuranceCompany: 'SulAmérica',
          policyNumber: 'POL-001234568',
          deductible: 0,
          coverageAmount: 5000
        },
        repair: {
          repairNotes: 'Aguardando aprovação do orçamento para compra dos pneus.',
          partsUsed: [],
          laborHours: 2
        },
        approval: {
          requiresApproval: true,
          budgetApproved: false
        },
        createdAt: '2024-04-18T14:20:00Z',
        updatedAt: '2024-04-18T14:20:00Z',
        createdBy: 'driver-002',
        updatedBy: 'driver-002'
      }
    ];
  }

  // CRUD Operations
  async getAllReports(filter?: DamageReportFilter): Promise<DamageReport[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        let filteredReports = [...this.reports];

        if (filter) {
          if (filter.vehicleId) {
            filteredReports = filteredReports.filter(r => r.vehicleId === filter.vehicleId);
          }
          if (filter.status) {
            filteredReports = filteredReports.filter(r => r.status === filter.status);
          }
          if (filter.severity) {
            filteredReports = filteredReports.filter(r => r.severity === filter.severity);
          }
          if (filter.reportType) {
            filteredReports = filteredReports.filter(r => r.reportType === filter.reportType);
          }
          if (filter.dateFrom) {
            filteredReports = filteredReports.filter(r => 
              new Date(r.reportDate) >= new Date(filter.dateFrom)
            );
          }
          if (filter.dateTo) {
            filteredReports = filteredReports.filter(r => 
              new Date(r.reportDate) <= new Date(filter.dateTo)
            );
          }
          if (filter.reportedBy) {
            filteredReports = filteredReports.filter(r => r.reportedBy === filter.reportedBy);
          }
          if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            filteredReports = filteredReports.filter(r => 
              r.description.title.toLowerCase().includes(searchLower) ||
              r.description.details.toLowerCase().includes(searchLower) ||
              r.vehiclePlate.toLowerCase().includes(searchLower)
            );
          }
        }

        resolve(filteredReports);
      }, 300);
    });
  }

  async getReportById(id: string): Promise<DamageReport | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const report = this.reports.find(r => r.id === id);
        resolve(report || null);
      }, 200);
    });
  }

  async createReport(reportData: Omit<DamageReport, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<DamageReport> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newReport: DamageReport = {
          ...reportData,
          id: `damage-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user',
          updatedBy: 'current-user'
        };

        this.reports.push(newReport);
        resolve(newReport);
      }, 500);
    });
  }

  async updateReport(id: string, updates: Partial<DamageReport>): Promise<DamageReport> {
    return new Promise(resolve => {
      setTimeout(() => {
        const reportIndex = this.reports.findIndex(r => r.id === id);
        if (reportIndex === -1) {
          throw new Error('Relatório de avaria não encontrado');
        }

        this.reports[reportIndex] = {
          ...this.reports[reportIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy: 'current-user'
        };

        resolve(this.reports[reportIndex]);
      }, 500);
    });
  }

  async deleteReport(id: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const reportIndex = this.reports.findIndex(r => r.id === id);
        if (reportIndex === -1) {
          throw new Error('Relatório de avaria não encontrado');
        }

        this.reports.splice(reportIndex, 1);
        resolve();
      }, 300);
    });
  }

  // Additional Methods
  async getReportsByVehicle(vehicleId: string): Promise<DamageReport[]> {
    return this.getAllReports({ vehicleId });
  }

  async getOpenReports(): Promise<DamageReport[]> {
    return this.getAllReports({ status: 'OPEN' });
  }

  async getCriticalReports(): Promise<DamageReport[]> {
    return this.getAllReports({ severity: 'CRITICAL' });
  }

  async getReportStats(filter?: DamageReportFilter): Promise<DamageReportStats> {
    return new Promise(resolve => {
      setTimeout(() => {
        const filteredReports = filter 
          ? this.reports.filter(r => {
            if (filter.vehicleId && r.vehicleId !== filter.vehicleId) return false;
            if (filter.dateFrom && new Date(r.reportDate) < new Date(filter.dateFrom)) return false;
            if (filter.dateTo && new Date(r.reportDate) > new Date(filter.dateTo)) return false;
            return true;
          })
          : this.reports;

        const stats: DamageReportStats = {
          total: filteredReports.length,
          byStatus: {},
          bySeverity: {},
          byType: {},
          totalCost: filteredReports.reduce((sum, r) => sum + r.estimatedCosts.total, 0),
          averageResolutionTime: 0, // Would calculate based on actual resolution times
          openReports: filteredReports.filter(r => r.status === 'OPEN').length,
          criticalReports: filteredReports.filter(r => r.severity === 'CRITICAL').length,
          monthlyTrend: [
            { month: 'Jan', count: 5, cost: 15000 },
            { month: 'Fev', count: 3, cost: 8000 },
            { month: 'Mar', count: 7, cost: 22000 },
            { month: 'Abr', count: 4, cost: 12000 }
          ]
        };

        // Calculate by status
        filteredReports.forEach(report => {
          stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1;
          stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;
          stats.byType[report.reportType] = (stats.byType[report.reportType] || 0) + 1;
        });

        resolve(stats);
      }, 400);
    });
  }

  async uploadDocument(reportId: string, document: Omit<DamageDocument, 'id' | 'uploadedAt'>): Promise<DamageDocument> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newDocument: DamageDocument = {
          ...document,
          id: `doc-${Date.now()}`,
          uploadedAt: new Date().toISOString()
        };

        // In a real implementation, this would upload to a file storage service
        console.log('Uploading document:', newDocument);

        resolve(newDocument);
      }, 1000);
    });
  }

  async addTimelineEvent(reportId: string, event: Omit<DamageEvent, 'id'>): Promise<DamageEvent> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newEvent: DamageEvent = {
          ...event,
          id: `event-${Date.now()}`
        };

        const reportIndex = this.reports.findIndex(r => r.id === reportId);
        if (reportIndex !== -1) {
          this.reports[reportIndex].timeline.push(newEvent);
        }

        resolve(newEvent);
      }, 300);
    });
  }

  async updateReportStatus(reportId: string, status: DamageReport['status'], notes?: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const reportIndex = this.reports.findIndex(r => r.id === reportId);
        if (reportIndex !== -1) {
          this.reports[reportIndex].status = status;
          this.reports[reportIndex].updatedAt = new Date().toISOString();
          
          // Add timeline event
          this.addTimelineEvent(reportId, {
            eventType: status === 'RESOLVED' ? 'REPAIR_COMPLETED' : status === 'CLOSED' ? 'CLOSED' : 'INSPECTED',
            timestamp: new Date().toISOString(),
            description: `Status alterado para ${status}${notes ? `. Nota: ${notes}` : ''}`,
            reportedBy: 'current-user'
          });
        }
        resolve();
      }, 300);
    });
  }

  // Utility Methods
  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      'LOW': 'Baixo',
      'MEDIUM': 'Médio',
      'HIGH': 'Alto',
      'CRITICAL': 'Crítico'
    };
    return labels[severity] || severity;
  }

  getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'OPEN': 'Aberto',
      'IN_PROGRESS': 'Em Andamento',
      'RESOLVED': 'Resolvido',
      'CLOSED': 'Fechado',
      'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'OPEN': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getReportTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'ACCIDENT': 'Acidente',
      'VANDALISM': 'Vandalismo',
      'WEAR': 'Desgaste',
      'MALFUNCTION': 'Falha Mecânica',
      'OTHER': 'Outro'
    };
    return labels[type] || type;
  }

  getAreaLabel(area: string): string {
    const labels: Record<string, string> = {
      'FRONT': 'Frente',
      'REAR': 'Traseira',
      'LEFT_SIDE': 'Lado Esquerdo',
      'RIGHT_SIDE': 'Lado Direito',
      'ROOF': 'Teto',
      'UNDERCARRIAGE': 'Chassi',
      'INTERIOR': 'Interior',
      'ENGINE': 'Motor',
      'TRANSMISSION': 'Transmissão',
      'BRAKES': 'Freios',
      'SUSPENSION': 'Suspensão',
      'ELECTRICAL': 'Elétrico',
      'TIRES': 'Pneus',
      'GLASS': 'Vidros',
      'LIGHTS': 'Luzes',
      'MIRRORS': 'Espelhos',
      'OTHER': 'Outro'
    };
    return labels[area] || area;
  }

  getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'PHOTO': 'Foto',
      'VIDEO': 'Vídeo',
      'REPORT': 'Relatório',
      'INVOICE': 'Fatura',
      'INSURANCE_CLAIM': 'Reivindicação Seguro',
      'POLICE_REPORT': 'Boletim Ocorrência',
      'WITNESS_STATEMENT': 'Declaração Testemunha',
      'OTHER': 'Outro'
    };
    return labels[type] || type;
  }
}

export default DamageReportService.getInstance();
