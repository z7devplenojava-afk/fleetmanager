import api from '@/lib/axios';
import { Visit, CreateVisitRequest, VisitFilters, VisitCalendarEvent, GeolocationData, QRCodeData } from '@/types/visit';

export const visitService = {
  // Buscar todas as visitas
  async getVisits(filters: VisitFilters = {}, page: number = 0, size: number = 20, sortBy: string = 'visitDate', sortDirection: string = 'DESC'): Promise<{
    content: Visit[];
    totalElements: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    
    if (filters.supervisorId) params.append('supervisorId', filters.supervisorId);
    if (filters.workPostId) params.append('workPostId', filters.workPostId);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortDirection', sortDirection);

    const response = await api.get(`/api/visits?${params.toString()}`);
    return response.data;
  },

  // Buscar visita por ID
  async getVisitById(id: string): Promise<Visit> {
    const response = await api.get(`/api/visits/${id}`);
    return response.data;
  },

  // Buscar visitas por supervisor
  async getVisitsBySupervisor(supervisorId: string, page: number = 0, size: number = 20): Promise<{
    content: Visit[];
    totalElements: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());

    const response = await api.get(`/api/visits/supervisor/${supervisorId}?${params.toString()}`);
    return response.data;
  },

  // Buscar visitas por período
  async getVisitsByDateRange(startDate: string, endDate: string, page: number = 0, size: number = 20): Promise<{
    content: Visit[];
    totalElements: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    params.append('page', page.toString());
    params.append('size', size.toString());

    const response = await api.get(`/api/visits/date-range?${params.toString()}`);
    return response.data;
  },

  // Buscar visitas agendadas para hoje
  async getScheduledVisitsForToday(): Promise<Visit[]> {
    const response = await api.get('/api/visits/today/scheduled');
    return response.data;
  },

  // Buscar visitas do supervisor para hoje
  async getSupervisorVisitsForToday(supervisorId: string): Promise<Visit[]> {
    const response = await api.get(`/api/visits/today/supervisor/${supervisorId}`);
    return response.data;
  },

  // Criar nova visita
  async createVisit(visitData: CreateVisitRequest): Promise<Visit> {
    const response = await api.post('/api/visits', visitData);
    return response.data;
  },

  // Atualizar visita
  async updateVisit(id: string, visitData: Partial<CreateVisitRequest>): Promise<Visit> {
    const response = await api.put(`/api/visits/${id}`, visitData);
    return response.data;
  },

  // Excluir visita
  async deleteVisit(id: string): Promise<void> {
    await api.delete(`/api/visits/${id}`);
  },

  // Upload de arquivo
  async uploadFile(visitId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/api/visits/${visitId}/upload-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload de foto
  async uploadPhoto(visitId: string, photo: File): Promise<string> {
    const formData = new FormData();
    formData.append('photo', photo);

    const response = await api.post(`/api/visits/${visitId}/upload-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Obter geolocalização atual
  async getCurrentLocation(): Promise<GeolocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não é suportada neste navegador'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          reject(new Error(`Erro ao obter geolocalização: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  },

  // Converter visitas para eventos do calendário
  convertToCalendarEvents(visits: Visit[]): VisitCalendarEvent[] {
    return visits.map(visit => {
      // Garantir que o status seja válido
      const status = visit.status || 'SCHEDULED';
      console.log('📅 Convertendo visita para evento do calendário:', {
        id: visit.id,
        status: status,
        workPost: visit.workPostName,
        color: this.getStatusColor(status)
      });
      
      return {
        id: visit.id,
        title: `${visit.workPostName} - ${visit.supervisorName}`,
        date: visit.visitDate,
        time: visit.visitTime,
        supervisor: visit.supervisorName,
        workPost: visit.workPostName,
        client: visit.clientName,
        status: status as any,
        color: this.getStatusColor(status),
      };
    });
  },

  // Obter cor do status
  getStatusColor(status: string): string {
    switch (status) {
      case 'SCHEDULED':
        return '#3b82f6'; // azul
      case 'IN_PROGRESS':
        return '#f59e0b'; // amarelo
      case 'COMPLETED':
        return '#10b981'; // verde
      case 'CANCELLED':
        return '#ef4444'; // vermelho
      case 'PENDING':
        return '#3b82f6'; // azul (mesma cor de SCHEDULED para compatibilidade)
      case 'NOT_COMPLETED':
        return '#6b7280'; // cinza
      case 'MISSED':
        return '#6b7280'; // cinza
      default:
        return '#6b7280'; // cinza padrão
    }
  },

  // Obter texto do status
  getStatusText(status: string): string {
    switch (status) {
      case 'SCHEDULED':
        return 'Agendada';
      case 'IN_PROGRESS':
        return 'Em Andamento';
      case 'COMPLETED':
        return 'Concluída';
      case 'CANCELLED':
        return 'Cancelada';
      case 'MISSED':
        return 'Não Realizada';
      default:
        return 'Desconhecido';
    }
  },

  // Simular dados de QR Code (em um sistema real, isso viria do backend)
  async simulateQRCodeScan(qrCodeData: string): Promise<QRCodeData> {
    // Simular delay de leitura
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular dados baseados no QR Code
    return {
      workPostId: 'post-001',
      workPostName: 'Posto Principal',
      clientId: 'client-001',
      clientName: 'Cliente Exemplo',
      employees: [
        {
          id: 'emp-001',
          name: 'João Silva',
          position: 'Vigilante'
        },
        {
          id: 'emp-002',
          name: 'Maria Santos',
          position: 'Supervisor'
        }
      ]
    };
  }
};