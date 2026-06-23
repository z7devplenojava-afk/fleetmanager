interface PrecisionMeasurement {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'CALIPER' | 'MICROMETER' | 'GAUGE' | 'LASER' | 'CMM' | 'OPTICAL' | 'COORDINATE' | 'SURFACE' | 'THICKNESS' | 'OTHER';
  serialNumber: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationStatus: 'VALID' | 'EXPIRED' | 'PENDING' | 'FAILED';
  location: {
    area: string;
    workstation: string;
    coordinates?: { x: number; y: number; z: number };
  };
  specifications: {
    range: { min: number; max: number; unit: string };
    resolution: number;
    accuracy: { value: number; unit: string };
    repeatability: number;
    operatingConditions: {
      temperature: { min: number; max: number; unit: string };
      humidity: { min: number; max: number; unit: string };
      vibration: boolean;
    };
  };
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'CALIBRATING' | 'ERROR';
  lastMaintenance: string;
  nextMaintenance: string;
  operator: string;
  measurements: Measurement[];
  statistics: {
    totalMeasurements: number;
    averageValue: number;
    standardDeviation: number;
    min: number;
    max: number;
    range: number;
    cp: number; // Process Capability
    cpk: number; // Process Capability Index
    ppm: number; // Parts Per Million
    yield: number;
  };
  alerts: MeasurementAlert[];
  createdAt: string;
  updatedAt: string;
}

interface Measurement {
  id: string;
  deviceId: string;
  timestamp: string;
  operator: string;
  operatorId: string;
  batchNumber?: string;
  partNumber: string;
  partDescription: string;
  measurementType: 'DIMENSION' | 'TOLERANCE' | 'SURFACE' | 'GEOMETRIC' | 'TEMPERATURE' | 'PRESSURE' | 'OTHER';
  characteristics: MeasurementCharacteristic[];
  environmentalConditions: {
    temperature: number;
    humidity: number;
    pressure?: number;
    vibration?: boolean;
  };
  status: 'PASS' | 'FAIL' | 'WARNING' | 'REWORK';
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

interface MeasurementCharacteristic {
  id: string;
  name: string;
  nominal: number;
  tolerance: { upper: number; lower: number };
  unit: string;
  measured: number;
  deviation: number;
  deviationPercent: number;
  status: 'IN_TOLERANCE' | 'OUT_OF_TOLERANCE' | 'CRITICAL';
  measurementMethod: string;
  gaugeId?: string;
  repeatReadings?: number[];
}

interface MeasurementAlert {
  id: string;
  deviceId: string;
  alertType: 'CALIBRATION_DUE' | 'MAINTENANCE_DUE' | 'OUT_OF_TOLERANCE' | 'DRIFT' | 'ENVIRONMENT' | 'SYSTEM_ERROR' | 'QUALITY_ISSUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  actionRequired: boolean;
  recommendedAction?: string;
}

interface GaugeStudy {
  id: string;
  deviceId: string;
  studyType: 'R&R' | 'LINEARITY' | 'STABILITY' | 'BIAS' | 'TYPE_A' | 'TYPE_B';
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  plannedDate: string;
  completedDate?: string;
  operator: string;
  parts: number;
  trials: number;
  appraisers: number;
  results: {
    gageRr: {
      ev: number; // Equipment Variation
      av: number; // Appraiser Variation
      pv: number; // Part Variation
      grr: number; // Total Gage R&R
      ndc: number; // Number of Distinct Categories
      contribution: number; // % Contribution
    };
    criteria: {
      acceptable: boolean;
      category: 'ACCEPTABLE' | 'MARGINAL' | 'UNACCEPTABLE';
      notes: string;
    };
  };
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

interface CalibrationRecord {
  id: string;
  deviceId: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationType: 'ROUTINE' | 'REPAIR' | 'ADJUSTMENT' | 'VERIFICATION';
  performedBy: string;
  laboratory: string;
  certificateNumber: string;
  results: {
    beforeCalibration: CalibrationPoint[];
    afterCalibration: CalibrationPoint[];
    adjustments: CalibrationAdjustment[];
    pass: boolean;
    notes: string;
  };
  cost: number;
  documents: CalibrationDocument[];
  createdAt: string;
}

interface CalibrationPoint {
  point: number;
  standardValue: number;
  measuredValue: number;
  error: number;
  tolerance: number;
  status: 'PASS' | 'FAIL';
}

interface CalibrationAdjustment {
  parameter: string;
  beforeValue: number;
  afterValue: number;
  adjustment: number;
  unit: string;
}

interface CalibrationDocument {
  id: string;
  type: 'CERTIFICATE' | 'REPORT' | 'DATA' | 'PHOTO' | 'OTHER';
  name: string;
  url: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
}

interface QualityControlPlan {
  id: string;
  partNumber: string;
  partDescription: string;
  revision: string;
  characteristics: QualityCharacteristic[];
  samplingPlan: {
    sampleSize: number;
    frequency: string;
    method: string;
    acceptanceCriteria: {
      aql: number; // Acceptable Quality Level
      inspectionLevel: string;
      doubleSampling?: boolean;
    };
  };
  measurementDevices: string[];
  approval: {
    preparedBy: string;
    approvedBy: string;
    approvedAt: string;
  };
  version: number;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

interface QualityCharacteristic {
  id: string;
  characteristic: string;
  specification: {
    nominal: number;
    tolerance: { upper: number; lower: number };
    unit: string;
  };
  measurementMethod: string;
  gaugeId: string;
  critical: boolean;
  notes?: string;
}

interface MeasurementFilter {
  deviceId?: string;
  deviceType?: string;
  dateFrom?: string;
  dateTo?: string;
  operatorId?: string;
  status?: string;
  partNumber?: string;
  batchNumber?: string;
  search?: string;
}

interface MeasurementStats {
  total: number;
  byStatus: Record<string, number>;
  byDeviceType: Record<string, number>;
  byOperator: Record<string, number>;
  yield: number;
  ppm: number;
  cp: number;
  cpk: number;
  calibrationDue: number;
  maintenanceDue: number;
  alerts: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trends: Array<{
    date: string;
    measurements: number;
    yield: number;
    defects: number;
  }>;
}

class PrecisionMeasurementService {
  private static instance: PrecisionMeasurementService;
  private devices: PrecisionMeasurement[] = [];
  private measurements: Measurement[] = [];
  private gaugeStudies: GaugeStudy[] = [];
  private calibrationRecords: CalibrationRecord[] = [];
  private qualityPlans: QualityControlPlan[] = [];

  private constructor() {
    this.initializeData();
  }

  static getInstance(): PrecisionMeasurementService {
    if (!PrecisionMeasurementService.instance) {
      PrecisionMeasurementService.instance = new PrecisionMeasurementService();
    }
    return PrecisionMeasurementService.instance;
  }

  private initializeData() {
    // Initialize sample devices
    this.devices = [
      {
        id: 'device-001',
        deviceId: 'CAL-001',
        deviceName: 'Paquímetro Digital Mitutoyo',
        deviceType: 'CALIPER',
        serialNumber: 'CD-6"PCB',
        calibrationDate: '2024-01-15T00:00:00Z',
        nextCalibrationDate: '2024-07-15T00:00:00Z',
        calibrationStatus: 'VALID',
        location: {
          area: 'Produção',
          workstation: 'WS-001',
          coordinates: { x: 10.5, y: 25.3, z: 1.2 }
        },
        specifications: {
          range: { min: 0, max: 150, unit: 'mm' },
          resolution: 0.01,
          accuracy: { value: 0.02, unit: 'mm' },
          repeatability: 0.01,
          operatingConditions: {
            temperature: { min: 10, max: 30, unit: '°C' },
            humidity: { min: 30, max: 80, unit: '%' },
            vibration: false
          }
        },
        status: 'ACTIVE',
        lastMaintenance: '2024-01-15T00:00:00Z',
        nextMaintenance: '2024-04-15T00:00:00Z',
        operator: 'João Silva',
        measurements: [],
        statistics: {
          totalMeasurements: 1250,
          averageValue: 75.25,
          standardDeviation: 0.015,
          min: 0.05,
          max: 149.95,
          range: 149.90,
          cp: 1.33,
          cpk: 1.28,
          ppm: 125,
          yield: 99.9875
        },
        alerts: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-04-15T10:30:00Z'
      },
      {
        id: 'device-002',
        deviceId: 'MIC-001',
        deviceName: 'Micrômetro Externo Starrett',
        deviceType: 'MICROMETER',
        serialNumber: 'M1-025"',
        calibrationDate: '2024-02-01T00:00:00Z',
        nextCalibrationDate: '2024-08-01T00:00:00Z',
        calibrationStatus: 'VALID',
        location: {
          area: 'Inspeção',
          workstation: 'WS-002'
        },
        specifications: {
          range: { min: 0, max: 25, unit: 'mm' },
          resolution: 0.001,
          accuracy: { value: 0.002, unit: 'mm' },
          repeatability: 0.001,
          operatingConditions: {
            temperature: { min: 15, max: 25, unit: '°C' },
            humidity: { min: 40, max: 70, unit: '%' },
            vibration: false
          }
        },
        status: 'ACTIVE',
        lastMaintenance: '2024-02-01T00:00:00Z',
        nextMaintenance: '2024-05-01T00:00:00Z',
        operator: 'Maria Santos',
        measurements: [],
        statistics: {
          totalMeasurements: 890,
          averageValue: 12.125,
          standardDeviation: 0.008,
          min: 0.001,
          max: 24.998,
          range: 24.997,
          cp: 1.45,
          cpk: 1.42,
          ppm: 85,
          yield: 99.9915
        },
        alerts: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-04-15T11:45:00Z'
      }
    ];

    // Initialize sample measurements
    this.measurements = [
      {
        id: 'meas-001',
        deviceId: 'device-001',
        timestamp: '2024-04-15T08:30:00Z',
        operator: 'João Silva',
        operatorId: 'op-001',
        batchNumber: 'BATCH-001',
        partNumber: 'PART-001',
        partDescription: 'Eixo de Transmissão',
        measurementType: 'DIMENSION',
        characteristics: [
          {
            id: 'char-001',
            name: 'Diâmetro Externo',
            nominal: 25.000,
            tolerance: { upper: 25.050, lower: 24.950 },
            unit: 'mm',
            measured: 25.012,
            deviation: 0.012,
            deviationPercent: 0.48,
            status: 'IN_TOLERANCE',
            measurementMethod: 'Paquímetro Digital',
            gaugeId: 'device-001',
            repeatReadings: [25.012, 25.011, 25.013]
          }
        ],
        environmentalConditions: {
          temperature: 22.5,
          humidity: 55,
          vibration: false
        },
        status: 'PASS',
        createdAt: '2024-04-15T08:30:00Z'
      }
    ];

    // Initialize sample gauge studies
    this.gaugeStudies = [
      {
        id: 'study-001',
        deviceId: 'device-001',
        studyType: 'R&R',
        status: 'COMPLETED',
        plannedDate: '2024-03-01T00:00:00Z',
        completedDate: '2024-03-15T00:00:00Z',
        operator: 'Carlos Mendes',
        parts: 10,
        trials: 3,
        appraisers: 3,
        results: {
          gageRr: {
            ev: 0.015,
            av: 0.008,
            pv: 0.125,
            grr: 0.017,
            ndc: 14,
            contribution: 11.5
          },
          criteria: {
            acceptable: true,
            category: 'ACCEPTABLE',
            notes: 'Sistema de medição adequado para aplicação'
          }
        },
        recommendations: [
          'Manter procedimento de calibração atual',
          'Treinar operadores sobre técnica de medição',
          'Realizar próximo estudo em 6 meses'
        ],
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-03-15T00:00:00Z'
      }
    ];
  }

  // Device Management
  async getAllDevices(): Promise<PrecisionMeasurement[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve([...this.devices]), 300);
    });
  }

  async getDeviceById(id: string): Promise<PrecisionMeasurement | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const device = this.devices.find(d => d.id === id);
        resolve(device || null);
      }, 200);
    });
  }

  async createDevice(deviceData: Omit<PrecisionMeasurement, 'id' | 'measurements' | 'statistics' | 'alerts' | 'createdAt' | 'updatedAt'>): Promise<PrecisionMeasurement> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newDevice: PrecisionMeasurement = {
          ...deviceData,
          id: `device-${Date.now()}`,
          measurements: [],
          statistics: {
            totalMeasurements: 0,
            averageValue: 0,
            standardDeviation: 0,
            min: 0,
            max: 0,
            range: 0,
            cp: 0,
            cpk: 0,
            ppm: 0,
            yield: 0
          },
          alerts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.devices.push(newDevice);
        resolve(newDevice);
      }, 500);
    });
  }

  async updateDevice(id: string, updates: Partial<PrecisionMeasurement>): Promise<PrecisionMeasurement> {
    return new Promise(resolve => {
      setTimeout(() => {
        const deviceIndex = this.devices.findIndex(d => d.id === id);
        if (deviceIndex === -1) {
          throw new Error('Dispositivo não encontrado');
        }

        this.devices[deviceIndex] = {
          ...this.devices[deviceIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };

        resolve(this.devices[deviceIndex]);
      }, 500);
    });
  }

  async deleteDevice(id: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const deviceIndex = this.devices.findIndex(d => d.id === id);
        if (deviceIndex === -1) {
          throw new Error('Dispositivo não encontrado');
        }

        this.devices.splice(deviceIndex, 1);
        resolve();
      }, 300);
    });
  }

  // Measurement Management
  async getAllMeasurements(filter?: MeasurementFilter): Promise<Measurement[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        let filteredMeasurements = [...this.measurements];

        if (filter) {
          if (filter.deviceId) {
            filteredMeasurements = filteredMeasurements.filter(m => m.deviceId === filter.deviceId);
          }
          if (filter.dateFrom) {
            filteredMeasurements = filteredMeasurements.filter(m => 
              new Date(m.timestamp) >= new Date(filter.dateFrom)
            );
          }
          if (filter.dateTo) {
            filteredMeasurements = filteredMeasurements.filter(m => 
              new Date(m.timestamp) <= new Date(filter.dateTo)
            );
          }
          if (filter.operatorId) {
            filteredMeasurements = filteredMeasurements.filter(m => m.operatorId === filter.operatorId);
          }
          if (filter.status) {
            filteredMeasurements = filteredMeasurements.filter(m => m.status === filter.status);
          }
        }

        resolve(filteredMeasurements);
      }, 300);
    });
  }

  async createMeasurement(measurementData: Omit<Measurement, 'id' | 'createdAt'>): Promise<Measurement> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newMeasurement: Measurement = {
          ...measurementData,
          id: `meas-${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        this.measurements.push(newMeasurement);

        // Update device statistics
        this.updateDeviceStatistics(measurementData.deviceId);

        resolve(newMeasurement);
      }, 500);
    });
  }

  async getMeasurementsByDevice(deviceId: string): Promise<Measurement[]> {
    return this.getAllMeasurements({ deviceId });
  }

  // Gauge Study Management
  async getAllGaugeStudies(): Promise<GaugeStudy[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve([...this.gaugeStudies]), 300);
    });
  }

  async createGaugeStudy(studyData: Omit<GaugeStudy, 'id' | 'createdAt' | 'updatedAt'>): Promise<GaugeStudy> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newStudy: GaugeStudy = {
          ...studyData,
          id: `study-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.gaugeStudies.push(newStudy);
        resolve(newStudy);
      }, 500);
    });
  }

  // Calibration Management
  async getCalibrationRecords(deviceId: string): Promise<CalibrationRecord[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const records = this.calibrationRecords.filter(r => r.deviceId === deviceId);
        resolve(records);
      }, 200);
    });
  }

  async createCalibrationRecord(recordData: Omit<CalibrationRecord, 'id' | 'createdAt'>): Promise<CalibrationRecord> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newRecord: CalibrationRecord = {
          ...recordData,
          id: `cal-${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        this.calibrationRecords.push(newRecord);

        // Update device calibration dates
        this.updateDeviceCalibration(recordData.deviceId, recordData.calibrationDate, recordData.nextCalibrationDate);

        resolve(newRecord);
      }, 500);
    });
  }

  // Quality Control Plans
  async getAllQualityPlans(): Promise<QualityControlPlan[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve([...this.qualityPlans]), 300);
    });
  }

  async createQualityPlan(planData: Omit<QualityControlPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<QualityControlPlan> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newPlan: QualityControlPlan = {
          ...planData,
          id: `plan-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.qualityPlans.push(newPlan);
        resolve(newPlan);
      }, 500);
    });
  }

  // Statistics and Analytics
  async getMeasurementStats(filter?: MeasurementFilter): Promise<MeasurementStats> {
    return new Promise(resolve => {
      setTimeout(() => {
        const filteredMeasurements = filter 
          ? this.measurements.filter(m => {
            if (filter.dateFrom && new Date(m.timestamp) < new Date(filter.dateFrom)) return false;
            if (filter.dateTo && new Date(m.timestamp) > new Date(filter.dateTo)) return false;
            return true;
          })
          : this.measurements;

        const stats: MeasurementStats = {
          total: filteredMeasurements.length,
          byStatus: {},
          byDeviceType: {},
          byOperator: {},
          yield: 99.5,
          ppm: 5000,
          cp: 1.33,
          cpk: 1.28,
          calibrationDue: this.devices.filter(d => d.calibrationStatus === 'EXPIRED').length,
          maintenanceDue: this.devices.filter(d => d.status === 'MAINTENANCE').length,
          alerts: {
            total: 15,
            critical: 2,
            high: 5,
            medium: 6,
            low: 2
          },
          trends: [
            { date: '2024-04-01', measurements: 120, yield: 99.2, defects: 1 },
            { date: '2024-04-02', measurements: 145, yield: 99.5, defects: 1 },
            { date: '2024-04-03', measurements: 132, yield: 99.8, defects: 0 },
            { date: '2024-04-04', measurements: 158, yield: 99.4, defects: 1 },
            { date: '2024-04-05', measurements: 167, yield: 99.7, defects: 0 }
          ]
        };

        // Calculate by status
        filteredMeasurements.forEach(measurement => {
          stats.byStatus[measurement.status] = (stats.byStatus[measurement.status] || 0) + 1;
        });

        resolve(stats);
      }, 400);
    });
  }

  // Utility Methods
  private updateDeviceStatistics(deviceId: string) {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) return;

    const deviceMeasurements = this.measurements.filter(m => m.deviceId === deviceId);
    
    if (deviceMeasurements.length > 0) {
      const allValues = deviceMeasurements.flatMap(m => m.characteristics.map(c => c.measured));
      const mean = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
      const variance = allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allValues.length;
      const stdDev = Math.sqrt(variance);
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);

      device.statistics = {
        totalMeasurements: deviceMeasurements.length,
        averageValue: mean,
        standardDeviation: stdDev,
        min,
        max,
        range: max - min,
        cp: 1.33,
        cpk: 1.28,
        ppm: 125,
        yield: 99.9875
      };
    }
  }

  private updateDeviceCalibration(deviceId: string, calibrationDate: string, nextCalibrationDate: string) {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      device.calibrationDate = calibrationDate;
      device.nextCalibrationDate = nextCalibrationDate;
      device.calibrationStatus = 'VALID';
    }
  }

  getDeviceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'CALIPER': 'Paquímetro',
      'MICROMETER': 'Micrômetro',
      'GAUGE': 'Relógio Comparador',
      'LASER': 'Medidor Laser',
      'CMM': 'Máquina de Medir por Coordenadas',
      'OPTICAL': 'Projetor de Perfil',
      'COORDINATE': 'Máquina de Coordenadas',
      'SURFACE': 'Rugosímetro',
      'THICKNESS': 'Medidor de Espessura',
      'OTHER': 'Outro'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Ativo',
      'INACTIVE': 'Inativo',
      'MAINTENANCE': 'Manutenção',
      'CALIBRATING': 'Calibrando',
      'ERROR': 'Erro'
    };
    return labels[status] || status;
  }

  getCalibrationStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'VALID': 'Válida',
      'EXPIRED': 'Expirada',
      'PENDING': 'Pendente',
      'FAILED': 'Falha'
    };
    return labels[status] || status;
  }

  getMeasurementStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PASS': 'Aprovado',
      'FAIL': 'Reprovado',
      'WARNING': 'Atenção',
      'REWORK': 'Retrabalho'
    };
    return labels[status] || status;
  }

  calculateProcessCapability(data: number[], tolerance: { upper: number; lower: number }): { cp: number; cpk: number } {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    const usl = tolerance.upper;
    const lsl = tolerance.lower;

    const cp = (usl - lsl) / (6 * stdDev);
    const cpk = Math.min((usl - mean) / (3 * stdDev), (mean - lsl) / (3 * stdDev));

    return { cp, cpk };
  }
}

export default PrecisionMeasurementService.getInstance();
