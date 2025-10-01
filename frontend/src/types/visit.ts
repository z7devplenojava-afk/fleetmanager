// Definindo o tipo UUID para ser usado em todas as interfaces
export type UUID = string;

export interface Visit {
  id?: UUID;
  visitDate: string;
  supervisorId: UUID;
  unitId: UUID;
  visitScheduleId?: UUID;
  status: VisitStatus;
  observations?: string;
  arrivalTime?: string;
  departureTime?: string;
  securityCheck?: boolean;
  equipmentCheck?: boolean;
  staffCheck?: boolean;
  procedureCheck?: boolean;
  
  // Campos para otimização de rota
  estimatedDurationMinutes?: number;
  priorityLevel?: number;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  routeOrder?: number;
  travelTimeToNextMinutes?: number;
  travelDistanceToNextKm?: number;
  
  // Dados para exibição
  supervisorName?: string;
  unitName?: string;
  unitAddress?: string;
  unitLatitude?: number;
  unitLongitude?: number;
  unitAddressCity?: string;
  unitAddressState?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

export enum VisitStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  NOT_COMPLETED = 'NOT_COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface VisitStatistics {
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  notCompletedVisits: number;
  completionRate: number;
}

export interface CreateVisitDTO {
  visitDate: string;
  supervisorId: UUID;
  unitId: UUID;
  observations?: string;
}

export interface UpdateVisitDTO {
  status?: VisitStatus;
  observations?: string;
  arrivalTime?: string;
  departureTime?: string;
  securityCheck?: boolean;
  equipmentCheck?: boolean;
  staffCheck?: boolean;
  procedureCheck?: boolean;
  estimatedDurationMinutes?: number;
  priorityLevel?: number;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
}

// Novos tipos para Escalas de Visita
export interface VisitSchedule {
  id?: UUID;
  scheduleDate: string;
  supervisorId: UUID;
  clientId: UUID;
  startTime: string;
  endTime: string;
  status: VisitScheduleStatus;
  totalEstimatedTimeMinutes?: number;
  totalTravelDistanceKm?: number;
  observations?: string;
  optimizedRoute?: string;
  routeOptimizationScore?: number;
  visits?: Visit[];
  
  // Dados para exibição
  supervisorName?: string;
  clientName?: string;
  
  // Controle de execução
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

export enum VisitScheduleStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}

export interface CreateVisitScheduleDTO {
  supervisorId: UUID;
  clientId: UUID;
  scheduleDate: string;
  unitIds: UUID[];
  startTime: string;
  endTime: string;
  observations?: string;
}

export interface RouteOptimizationStats {
  totalVisits: number;
  totalDistanceKm: number;
  totalTravelTimeMinutes: number;
  totalVisitTimeMinutes: number;
  totalDayTimeMinutes: number;
  efficiencyScore: number;
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

export interface Unit {
  id: UUID;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  code?: string;
  manager?: string;
  active: boolean;
  latitude?: number;
  longitude?: number;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  clientId?: UUID;
  clientName?: string;
}

export interface Client {
  id: UUID;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: string;
  notes?: string;
  units?: Unit[];
}
