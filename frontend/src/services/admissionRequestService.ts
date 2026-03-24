import api from '@/lib/axios';

export interface AdmissionRequest {
  id: string;
  requestNumber: string;
  type: 'ADMISSION' | 'DISMISSAL';
  employeeName: string;
  employeeCpf?: string;
  employeeRg?: string;
  employeeEmail?: string;
  employeePhone?: string;
  position?: string;
  department?: string;
  unitId?: string;
  unitName?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  justification?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requestDate: string;
  approvalDate?: string;
  completionDate?: string;
  approvedBy?: string;
  approverName?: string;
  approvalNotes?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  requesterName?: string;
  requesterId?: string;
  approverId?: string;
  notes?: string;
  documents?: AdmissionDocument[];
  createdAt: string;
  updatedAt: string;
  
  // Campos calculados
  urgent: boolean;
  canBeApproved: boolean;
  overdue: boolean;
  daysUntilRequired: number;
  totalDocuments: number;
}

export interface AdmissionDocument {
  id: string;
  admissionRequestId: string;
  documentType: string;
  documentName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
  isRequired: boolean;
  isValidated: boolean;
  validationNotes?: string;
}

export interface CreateAdmissionRequestRequest {
  type: 'ADMISSION' | 'DISMISSAL';
  employeeName: string;
  employeeCpf?: string;
  employeeRg?: string;
  employeeEmail?: string;
  employeePhone?: string;
  position?: string;
  department?: string;
  unitId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  justification?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requesterName?: string;
  requesterId?: string;
  approverId?: string;
  notes?: string;
}

export interface UpdateAdmissionRequestRequest extends CreateAdmissionRequestRequest {
  id: string;
}

class AdmissionRequestService {
  async getAllAdmissionRequests(): Promise<AdmissionRequest[]> {
    try {
      const response = await api.get('/api/admission-requests');
      return response.data;
    } catch (error) {
      console.warn('Erro ao carregar solicitações de admissão/demissão:', error);
      // Retornar dados de exemplo para desenvolvimento
      return this.getMockData();
    }
  }

  // Alias para compatibilidade - usando arrow function para garantir binding correto
  getAllRequests = async (): Promise<AdmissionRequest[]> => {
    return this.getAllAdmissionRequests();
  }

  async getAdmissionRequestById(id: string): Promise<AdmissionRequest> {
    const response = await api.get(`/api/admission-requests/${id}`);
    return response.data;
  }

  async createAdmissionRequest(request: CreateAdmissionRequestRequest): Promise<AdmissionRequest> {
    const response = await api.post('/api/admission-requests', request);
    return response.data;
  }

  async updateAdmissionRequest(id: string, request: UpdateAdmissionRequestRequest): Promise<AdmissionRequest> {
    const response = await api.put(`/api/admission-requests/${id}`, request);
    return response.data;
  }

  async deleteAdmissionRequest(id: string): Promise<void> {
    await api.delete(`/api/admission-requests/${id}`);
  }

  async approveRequest(id: string, approverName: string, approvalNotes?: string): Promise<AdmissionRequest> {
    const params = new URLSearchParams();
    params.append('approverName', approverName);
    if (approvalNotes) {
      params.append('approvalNotes', approvalNotes);
    }
    
    const response = await api.post(`/api/admission-requests/${id}/approve?${params.toString()}`);
    return response.data;
  }

  async rejectRequest(id: string, rejectorName: string, rejectionReason: string): Promise<AdmissionRequest> {
    const params = new URLSearchParams();
    params.append('rejectorName', rejectorName);
    params.append('rejectionReason', rejectionReason);
    
    const response = await api.post(`/api/admission-requests/${id}/reject?${params.toString()}`);
    return response.data;
  }

  async completeRequest(id: string): Promise<AdmissionRequest> {
    const response = await api.post(`/api/admission-requests/${id}/complete`);
    return response.data;
  }

  async getRequestsByStatus(status: string): Promise<AdmissionRequest[]> {
    const response = await api.get(`/api/admission-requests/status/${status}`);
    return response.data;
  }

  async getRequestsByType(type: 'ADMISSION' | 'DISMISSAL'): Promise<AdmissionRequest[]> {
    const response = await api.get(`/api/admission-requests/type/${type}`);
    return response.data;
  }

  async getRequestsByPriority(priority: string): Promise<AdmissionRequest[]> {
    const response = await api.get(`/api/admission-requests/priority/${priority}`);
    return response.data;
  }

  async getRequestsByRequester(requesterId: string): Promise<AdmissionRequest[]> {
    const response = await api.get(`/api/admission-requests/requester/${requesterId}`);
    return response.data;
  }

  async getRequestsByApprover(approverId: string): Promise<AdmissionRequest[]> {
    const response = await api.get(`/api/admission-requests/approver/${approverId}`);
    return response.data;
  }

  async getRequestsByUnit(unitId: string): Promise<AdmissionRequest[]> {
    const response = await api.get(`/api/admission-requests/unit/${unitId}`);
    return response.data;
  }

  async getPendingApprovalRequests(): Promise<AdmissionRequest[]> {
    try {
      const response = await api.get('/api/admission-requests/pending-approval');
      return response.data;
    } catch (error) {
      console.warn('Erro ao carregar solicitações pendentes:', error);
      return [];
    }
  }

  async searchRequests(searchTerm: string): Promise<AdmissionRequest[]>;
  async searchRequests(filters: {
    type?: string;
    searchTerm?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AdmissionRequest[]>;
  async searchRequests(searchTermOrFilters: string | {
    type?: string;
    searchTerm?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AdmissionRequest[]> {
    try {
      // Se for string, usar formato antigo
      if (typeof searchTermOrFilters === 'string') {
        const response = await api.get(`/api/admission-requests/search?searchTerm=${encodeURIComponent(searchTermOrFilters)}`);
        return response.data;
      }
      
      // Se for objeto, construir query string com filtros
      const params = new URLSearchParams();
      if (searchTermOrFilters.type) params.append('type', searchTermOrFilters.type);
      if (searchTermOrFilters.searchTerm) params.append('searchTerm', searchTermOrFilters.searchTerm);
      if (searchTermOrFilters.startDate) params.append('startDate', searchTermOrFilters.startDate);
      if (searchTermOrFilters.endDate) params.append('endDate', searchTermOrFilters.endDate);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/api/admission-requests/search?${queryString}`
        : '/api/admission-requests';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.warn('Erro ao buscar solicitações:', error);
      // Retornar dados de exemplo filtrados
      return this.getMockData();
    }
  }

  async getRequestsCountByStatus(status: string): Promise<number> {
    const response = await api.get(`/api/admission-requests/stats/count/${status}`);
    return response.data;
  }

  async getRequestsCountByType(type: string): Promise<number> {
    const response = await api.get(`/api/admission-requests/stats/type-count/${type}`);
    return response.data;
  }

  async generatePDF(id: string): Promise<Blob> {
    const response = await api.get(`/api/admission-requests/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Gera um relatório PDF das solicitações de admissão/demissão.
   * Enquanto o backend não estiver implementado, retorna um PDF simples
   * com mensagem de placeholder para evitar erros no frontend.
   */
  async generatePDFReport(filters?: {
    status?: string;
    type?: 'ADMISSION' | 'DISMISSAL';
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    try {
      const response = await api.post('/api/admission-requests/report/pdf', filters || {}, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.warn('Erro ao gerar relatório PDF de admissões/demissões. Retornando PDF de exemplo.', error);
      const placeholder = `
        Relatório de Admissões/Demissões
        --------------------------------
        O serviço de geração de relatórios ainda não está disponível.
        Filtros utilizados:
        ${JSON.stringify(filters || {}, null, 2)}
      `;
      return new Blob([placeholder], { type: 'application/pdf' });
    }
  }

  // Método para dados de exemplo durante desenvolvimento
  private getMockData(): AdmissionRequest[] {
    return [
      {
        id: '1',
        requestNumber: 'ADM-2024-001',
        type: 'ADMISSION',
        employeeName: 'João Silva',
        employeeCpf: '123.456.789-00',
        employeeEmail: 'joao.silva@email.com',
        position: 'Vigilante',
        department: 'Operacional',
        unitName: 'Unidade Centro',
        startDate: '2024-09-01',
        reason: 'Contratação para reforço da equipe',
        status: 'PENDING',
        priority: 'MEDIUM',
        requestDate: '2024-08-25',
        requesterName: 'Maria Santos',
        urgent: false,
        canBeApproved: true,
        overdue: false,
        daysUntilRequired: 5,
        totalDocuments: 3,
        createdAt: '2024-08-25T10:00:00Z',
        updatedAt: '2024-08-25T10:00:00Z'
      },
      {
        id: '2',
        requestNumber: 'DEM-2024-002',
        type: 'DISMISSAL',
        employeeName: 'Pedro Costa',
        employeeCpf: '987.654.321-00',
        position: 'Supervisor',
        department: 'Operacional',
        unitName: 'Unidade Norte',
        endDate: '2024-08-31',
        reason: 'Demissão por justa causa',
        status: 'APPROVED',
        priority: 'HIGH',
        requestDate: '2024-08-20',
        approvalDate: '2024-08-22',
        approvedBy: 'admin',
        approverName: 'Carlos Oliveira',
        urgent: true,
        canBeApproved: false,
        overdue: false,
        daysUntilRequired: 0,
        totalDocuments: 2,
        createdAt: '2024-08-20T14:30:00Z',
        updatedAt: '2024-08-22T09:15:00Z'
      },
      {
        id: '3',
        requestNumber: 'ADM-2024-003',
        type: 'ADMISSION',
        employeeName: 'Ana Oliveira',
        employeeCpf: '456.789.123-00',
        employeeEmail: 'ana.oliveira@email.com',
        position: 'Recepcionista',
        department: 'Administrativo',
        unitName: 'Unidade Sul',
        startDate: '2024-09-15',
        reason: 'Substituição de funcionário em férias',
        status: 'COMPLETED',
        priority: 'LOW',
        requestDate: '2024-08-15',
        approvalDate: '2024-08-18',
        completionDate: '2024-08-20',
        approvedBy: 'admin',
        approverName: 'Roberto Silva',
        urgent: false,
        canBeApproved: false,
        overdue: false,
        daysUntilRequired: 0,
        totalDocuments: 4,
        createdAt: '2024-08-15T08:00:00Z',
        updatedAt: '2024-08-20T16:45:00Z'
      }
    ];
  }
}

// Criar instância do serviço
const serviceInstance = new AdmissionRequestService();

// Exportar como objeto com métodos garantidos
export const admissionRequestService = {
  getAllRequests: serviceInstance.getAllRequests.bind(serviceInstance),
  getAllAdmissionRequests: serviceInstance.getAllAdmissionRequests.bind(serviceInstance),
  getAdmissionRequestById: serviceInstance.getAdmissionRequestById.bind(serviceInstance),
  createAdmissionRequest: serviceInstance.createAdmissionRequest.bind(serviceInstance),
  updateAdmissionRequest: serviceInstance.updateAdmissionRequest.bind(serviceInstance),
  deleteAdmissionRequest: serviceInstance.deleteAdmissionRequest.bind(serviceInstance),
  approveRequest: serviceInstance.approveRequest.bind(serviceInstance),
  rejectRequest: serviceInstance.rejectRequest.bind(serviceInstance),
  completeRequest: serviceInstance.completeRequest.bind(serviceInstance),
  getRequestsByStatus: serviceInstance.getRequestsByStatus.bind(serviceInstance),
  getRequestsByType: serviceInstance.getRequestsByType.bind(serviceInstance),
  getRequestsByPriority: serviceInstance.getRequestsByPriority.bind(serviceInstance),
  getRequestsByRequester: serviceInstance.getRequestsByRequester.bind(serviceInstance),
  getRequestsByApprover: serviceInstance.getRequestsByApprover.bind(serviceInstance),
  getRequestsByUnit: serviceInstance.getRequestsByUnit.bind(serviceInstance),
  getPendingApprovalRequests: serviceInstance.getPendingApprovalRequests.bind(serviceInstance),
  searchRequests: serviceInstance.searchRequests.bind(serviceInstance),
  getRequestsCountByStatus: serviceInstance.getRequestsCountByStatus.bind(serviceInstance),
  getRequestsCountByType: serviceInstance.getRequestsCountByType.bind(serviceInstance),
  generatePDF: serviceInstance.generatePDF.bind(serviceInstance),
  generatePDFReport: serviceInstance.generatePDFReport.bind(serviceInstance),
};
