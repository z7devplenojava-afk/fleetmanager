export interface Visit {
  id: string;
  supervisorId: string;
  supervisorName: string;
  workPostId: string;
  workPostName: string;
  clientId: string;
  clientName: string;
  visitDate: string;
  visitTime: string;
  description?: string;
  observations?: string;
  status: VisitStatus;
  presentEmployees: string[];
  presentEmployeeNames?: string[];
  attachedFiles: string[];
  photos: string[];
  
  // Geolocalização
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  
  // QR Code
  qrCodeScanned?: string;
  qrCodeVerified: boolean;
  
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  updatedByName?: string;
}

export enum VisitStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING', // Mantido para compatibilidade
  NOT_COMPLETED = 'NOT_COMPLETED' // Mantido para compatibilidade
}

export enum VisitScheduleStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}

export interface CreateVisitRequest {
  supervisorId: string;
  workPostId: string;
  clientId: string;
  visitDate: string;
  visitTime: string;
  description?: string;
  observations?: string;
  status?: VisitStatus;
  presentEmployees?: string[];
  attachedFiles?: string[];
  photos?: string[];
  
  // Funcionário identificado no local (quando QR Code não funciona)
  employeeId?: string;
  employeeCpf?: string;
  employeeRegistrationNumber?: string;
  
  // Geolocalização
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  
  // QR Code
  qrCodeScanned?: string;
  qrCodeVerified?: boolean;
  
  // Cancelamento
  cancellationReason?: string;
}

export interface VisitFilters {
  supervisorId?: string;
  workPostId?: string;
  clientId?: string;
  status?: VisitStatus;
  startDate?: string;
  endDate?: string;
}

export interface VisitCalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  supervisor: string;
  workPost: string;
  client: string;
  status: VisitStatus;
  color: string;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface QRCodeData {
  workPostId: string;
  workPostName: string;
  clientId: string;
  clientName: string;
  employees: {
    id: string;
    name: string;
    position: string;
  }[];
}

export interface VisitStatistics {
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  cancelledVisits: number;
  completionRate: number;
  averageDuration: number;
}

export interface VisitSchedule {
  id: string;
  scheduleDate: string;
  supervisorId: string;
  supervisorName: string;
  clientId: string;
  clientName: string;
  startTime: string;
  endTime: string;
  status: VisitScheduleStatus;
  totalEstimatedTimeMinutes?: number;
  totalTravelDistanceKm?: number;
  routeOptimizationScore?: number;
  observations?: string;
  optimizedRoute?: string;
  visits: Visit[];
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EfficiencyReport {
  period: string;
  totalSchedules: number;
  completedSchedules: number;
  completionRate: number;
  avgOptimizationScore: number;
  totalDistanceKm: number;
  totalTimeHours: number;
}