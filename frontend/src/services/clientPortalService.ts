import api from '@/lib/axios';

export interface ContractSummary {
  id: string;
  contractNumber: string;
  description: string;
  obraName?: string;
  startDate: string;
  endDate?: string;
  status: string;
  vehicleQuantity?: number;
  value?: number;
  hasReserveClause?: boolean;
}

export interface VehicleSummary {
  id: string;
  plate: string;
  fleetNumber?: string;
  model: string;
  brand: string;
  year: number;
  capacity: number;
  status: string;
  assignedDriver?: string;
  contractNumber?: string;
  lastChecklistStatus?: string;
}

export interface RecentRequest {
  id: string;
  requestType: 'RESERVE_VEHICLE' | 'EXTRA_TRIP' | 'SCHEDULE_CHANGE' | 'OTHER';
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  title: string;
  reason: string;
  origin?: string;
  destination?: string;
  departureDateTime?: string;
  assignedVehiclePlate?: string;
  assignedDriverName?: string;
  responseNotes?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  messageCount?: number;
  messages?: Array<{
    id: string;
    content: string;
    senderName: string;
    isSupport: boolean;
    createdAt: string;
  }>;
}

export interface ClientPortalDashboardData {
  clientId: string;
  clientName: string;
  clientCnpj: string;
  companyName: string;
  activeContractsCount: number;
  totalVehiclesAllocated: number;
  pendingRequestsCount: number;
  openTicketsCount: number;
  resolvedTicketsCount: number;
  contracts: ContractSummary[];
  vehicles: VehicleSummary[];
  recentRequests: RecentRequest[];
  recentTickets: SupportTicket[];
}

export interface ReserveVehiclePayload {
  contractId?: string;
  affectedVehiclePlate: string;
  reason: string;
  observations?: string;
  isExtraReserve?: boolean;
}

export interface ExtraTripPayload {
  contractId?: string;
  origin: string;
  destination: string;
  departureDateTime: string;
  returnDateTime?: string;
  passengerCount: number;
  vehicleTypeNeeded?: string;
  reason: string;
  observations?: string;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  category: 'ATRASO_DESVIO_ROTA' | 'MANUTENCAO_HIGIENE' | 'MUDANCA_PONTO' | 'DUVIDAS_FINANCEIRAS' | 'OUTROS' | string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  contractId?: string;
  vehiclePlate?: string;
  contactPhone?: string;
}

export const clientPortalService = {
  getDashboard: async (): Promise<ClientPortalDashboardData> => {
    const response = await api.get('/client-portal/dashboard');
    return response.data;
  },

  getVehicles: async (): Promise<VehicleSummary[]> => {
    const response = await api.get('/client-portal/vehicles');
    return response.data;
  },

  requestReserveVehicle: async (payload: ReserveVehiclePayload): Promise<RecentRequest> => {
    const response = await api.post('/client-portal/requests/reserve-vehicle', payload);
    return response.data;
  },

  requestExtraTrip: async (payload: ExtraTripPayload): Promise<RecentRequest> => {
    const response = await api.post('/client-portal/requests/extra-trip', payload);
    return response.data;
  },

  getRequests: async (): Promise<RecentRequest[]> => {
    const response = await api.get('/client-portal/requests');
    return response.data;
  },

  getTickets: async (): Promise<SupportTicket[]> => {
    const response = await api.get('/client-portal/tickets');
    return response.data;
  },

  createTicket: async (payload: CreateTicketPayload): Promise<SupportTicket> => {
    const response = await api.post('/client-portal/tickets', payload);
    return response.data;
  },

  addTicketMessage: async (ticketId: string, message: string) => {
    const response = await api.post(`/client-portal/tickets/${ticketId}/messages`, { message });
    return response.data;
  }
};
