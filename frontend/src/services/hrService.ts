import api from '@/lib/axios';
import { 
  Employee, 
  JobVacancy, 
  Transfer, 
  Occurrence, 
  Vacation, 
  Benefit, 
  JobPosition, 
  WorkStation,
  EPIAssignment,
  LGPDConsent,
  ServiceOrder
} from '../types/hr';

// Tipos para a API
interface EmployeeAPI {
  id: number;
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  photoUrl?: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bankInfo: {
    bank: string;
    agency: string;
    account: string;
    accountType: 'CHECKING' | 'SAVINGS';
  };
  jobInfo: {
    position: string;
    function: string;
    unit: string;
    admissionDate: string;
    probationEndDate: string;
    contractType: 'EXPERIENCE' | 'INDEFINITE' | 'TEMPORARY';
    salary: number;
    status: 'ACTIVE' | 'INACTIVE' | 'VACATION' | 'SICK_LEAVE' | 'TERMINATED';
  };
  documents: {
    id: number;
    type: string;
    number: string;
    issueDate: string;
    issuingAuthority: string;
  }[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface JobVacancyAPI {
  id: number;
  title: string;
  position: string;
  function: string;
  location: string;
  requirements: string[];
  workSchedule: string;
  salary: number;
  benefits: string[];
  deadline: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  applications: number;
  createdAt: string;
  updatedAt: string;
}

interface TransferAPI {
  id: number;
  employeeId: number;
  employeeName: string;
  fromPosition: string;
  toPosition: string;
  fromUnit: string;
  toUnit: string;
  fromFunction: string;
  toFunction: string;
  reason: string;
  transferDate: string;
  approvedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OccurrenceAPI {
  id: number;
  employeeId: number;
  employeeName: string;
  type: 'MEDICAL_CERTIFICATE' | 'WARNING' | 'AWARD' | 'JUSTIFIED_ABSENCE';
  description: string;
  date: string;
  duration?: number;
  documentUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface VacationAPI {
  id: string | number;
  employeeId: string | number;
  employeeName: string;
  type?: 'REGULAR' | 'COLLECTIVE' | 'COMPENSATORY';
  acquisitionPeriod?: string;
  concessionPeriod?: string;
  startDate: string;
  endDate: string;
  daysTaken?: number;
  days?: number;
  remainingDays?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BenefitAPI {
  id: number;
  name: string;
  type: 'TRANSPORT' | 'MEAL' | 'HEALTH' | 'DENTAL' | 'LIFE_INSURANCE' | 'OTHER';
  description: string;
  value: number;
  unit: 'FIXED' | 'PERCENTAGE';
  positions: string[];
  units: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface JobPositionAPI {
  id: number;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  mandatoryTrainings: string[];
  salaryRange: {
    min: number;
    max: number;
  };
  benefits: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkStationAPI {
  id: number;
  name: string;
  description: string;
  location: string;
  clientId: number;
  clientName: string;
  unit: string;
  contractId: number;
  requiredPositions: {
    position: string;
    quantity: number;
  }[];
  infrastructure: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  implantationDate: string;
  checklist: {
    infrastructure: boolean;
    hr: boolean;
    epi: boolean;
    training: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface EPIAssignmentAPI {
  id: number;
  employeeId: number;
  employeeName: string;
  epiId: number;
  epiName: string;
  assignmentDate: string;
  returnDate?: string;
  status: 'ASSIGNED' | 'RETURNED' | 'LOST' | 'DAMAGED';
  digitalSignature?: string;
  photoUrl?: string;
  notes?: string;
  assignedBy: string;
  returnedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface LGPDConsentAPI {
  id: number;
  employeeId: number;
  employeeName: string;
  consentDate: string;
  consentType: 'DATA_PROCESSING' | 'DATA_SHARING' | 'MARKETING';
  documentUrl: string;
  ipAddress: string;
  userAgent: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceOrderAPI {
  id: number;
  employeeId: number;
  employeeName: string;
  function: string;
  clientId: number;
  clientName: string;
  workStationId: number;
  workStationName: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  digitalSignature?: string;
  documentUrl: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

class HRService {
  // ===== GESTÃO DE FUNCIONÁRIOS =====

  // Buscar todos os funcionários
  async getEmployees(filters?: {
    status?: string;
    unit?: string;
    position?: string;
    function?: string;
  }): Promise<Employee[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.unit) params.append('unit', filters.unit);
      if (filters?.position) params.append('position', filters.position);
      if (filters?.function) params.append('function', filters.function);

      const url = `/api/hr/employees${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((emp: EmployeeAPI) => this.mapEmployeeFromAPI(emp));
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      return this.getMockEmployees();
    }
  }

  // Buscar funcionário por ID
  async getEmployee(id: number): Promise<Employee | null> {
    try {
      const response = await api.get(`/api/hr/employees/${id}`);
      return this.mapEmployeeFromAPI(response.data);
    } catch (error) {
      console.error('Erro ao buscar funcionário:', error);
      return null;
    }
  }

  // Criar novo funcionário
  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    try {
      const response = await api.post('/api/hr/employees', employee);
      return this.mapEmployeeFromAPI(response.data);
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      throw new Error('Erro ao criar funcionário');
    }
  }

  // Atualizar funcionário
  async updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee> {
    try {
      const response = await api.put(`/api/hr/employees/${id}`, employee);
      return this.mapEmployeeFromAPI(response.data);
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw new Error('Erro ao atualizar funcionário');
    }
  }

  // Deletar funcionário
  async deleteEmployee(id: number): Promise<void> {
    try {
      await api.delete(`/hr/employees/${id}`);
    } catch (error) {
      console.error('Erro ao deletar funcionário:', error);
      throw new Error('Erro ao deletar funcionário');
    }
  }

  // Buscar funcionários com experiência vencendo
  async getEmployeesWithExpiringProbation(days: number = 7): Promise<Employee[]> {
    try {
      const response = await api.get(`/api/hr/employees/probation-expiring?days=${days}`);
      return response.data.map((emp: EmployeeAPI) => this.mapEmployeeFromAPI(emp));
    } catch (error) {
      console.error('Erro ao buscar funcionários com experiência vencendo:', error);
      return [];
    }
  }

  // ===== VAGAS =====

  // Buscar vagas
  async getJobVacancies(filters?: {
    status?: string;
    position?: string;
    location?: string;
  }): Promise<JobVacancy[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.position) params.append('position', filters.position);
      if (filters?.location) params.append('location', filters.location);

      const url = `/hr/vacancies${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data.map((vacancy: JobVacancyAPI) => ({
        id: vacancy.id,
        title: vacancy.title,
        position: vacancy.position,
        function: vacancy.function,
        location: vacancy.location,
        requirements: vacancy.requirements,
        workSchedule: vacancy.workSchedule,
        salary: vacancy.salary,
        benefits: vacancy.benefits,
        deadline: vacancy.deadline,
        status: vacancy.status,
        applications: vacancy.applications,
        createdAt: vacancy.createdAt,
        updatedAt: vacancy.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar vagas:', error);
      throw error; // Removido o retorno de mock
    }
  }

  // Criar vaga
  async createJobVacancy(vacancy: Omit<JobVacancy, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobVacancy> {
    try {
      const response = await api.post('/api/hr/vacancies', vacancy);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar vaga:', error);
      throw new Error('Erro ao criar vaga');
    }
  }

  // Atualizar vaga
  async updateJobVacancy(id: number, vacancy: Partial<JobVacancy>): Promise<JobVacancy> {
    try {
      const response = await api.put(`/hr/vacancies/${id}`, vacancy);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar vaga:', error);
      throw new Error('Erro ao atualizar vaga');
    }
  }

  // Excluir vaga
  async deleteJobVacancy(id: number): Promise<void> {
    try {
      await api.delete(`/hr/vacancies/${id}`);
    } catch (error) {
      console.error('Erro ao excluir vaga:', error);
      throw new Error('Erro ao excluir vaga');
    }
  }

  // Buscar vagas públicas
  async getPublicJobVacancies(): Promise<JobVacancy[]> {
    try {
      console.log('🔍 Fazendo requisição GET para /api/public/vacancies');
      const response = await api.get('/api/public/vacancies');
      console.log('✅ Resposta recebida:', response.data);
      console.log('📊 Tipo da resposta:', typeof response.data);
      console.log('📊 É array?', Array.isArray(response.data));
      
      // Verificar se a resposta é um array ou objeto com content
      const vacancies = Array.isArray(response.data) 
        ? response.data 
        : response.data.content || [];
      
      console.log('📋 Vagas processadas:', vacancies.length);
      
      return vacancies.map((vacancy: JobVacancyAPI) => ({
        id: vacancy.id,
        title: vacancy.title,
        position: vacancy.position,
        function: vacancy.function,
        location: vacancy.location,
        requirements: vacancy.requirements,
        workSchedule: vacancy.workSchedule,
        salary: vacancy.salary,
        benefits: vacancy.benefits,
        deadline: vacancy.deadline,
        status: vacancy.status,
        applications: vacancy.applications,
        createdAt: vacancy.createdAt,
        updatedAt: vacancy.updatedAt
      }));
    } catch (error) {
      console.error('❌ Erro detalhado ao buscar vagas públicas:', error);
      console.error('❌ Response status:', error.response?.status);
      console.error('❌ Response data:', error.response?.data);
      console.error('Erro ao buscar vagas públicas:', error);
      return this.getMockJobVacancies();
    }
  }

  // Aplicar para vaga
  async applyToVacancy(id: number): Promise<void> {
    try {
      await api.post(`/public/vacancies/${id}/apply`);
    } catch (error) {
      console.error('Erro ao aplicar para vaga:', error);
      throw new Error('Erro ao aplicar para vaga');
    }
  }

  // ===== REMANEJAMENTOS =====

  // Buscar remanejamentos
  async getTransfers(filters?: {
    employeeId?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Transfer[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);

      const url = `/hr/transfers${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((transfer: TransferAPI) => ({
        id: transfer.id,
        employeeId: transfer.employeeId,
        employeeName: transfer.employeeName,
        fromPosition: transfer.fromPosition,
        toPosition: transfer.toPosition,
        fromUnit: transfer.fromUnit,
        toUnit: transfer.toUnit,
        fromFunction: transfer.fromFunction,
        toFunction: transfer.toFunction,
        reason: transfer.reason,
        transferDate: transfer.transferDate,
        approvedBy: transfer.approvedBy,
        status: transfer.status,
        notes: transfer.notes,
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar remanejamentos:', error);
      return this.getMockTransfers();
    }
  }

  // Criar remanejamento
  async createTransfer(transfer: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transfer> {
    try {
      const response = await api.post('/api/hr/transfers', transfer);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar remanejamento:', error);
      throw new Error('Erro ao criar remanejamento');
    }
  }

  // ===== OCORRÊNCIAS =====

  // Buscar ocorrências
  async getOccurrences(filters?: {
    employeeId?: number;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Occurrence[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId.toString());
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);

      const url = `/hr/occurrences${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((occurrence: OccurrenceAPI) => ({
        id: occurrence.id,
        employeeId: occurrence.employeeId,
        employeeName: occurrence.employeeName,
        type: occurrence.type,
        description: occurrence.description,
        date: occurrence.date,
        duration: occurrence.duration,
        documentUrl: occurrence.documentUrl,
        status: occurrence.status,
        approvedBy: occurrence.approvedBy,
        approvedAt: occurrence.approvedAt,
        notes: occurrence.notes,
        createdAt: occurrence.createdAt,
        updatedAt: occurrence.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar ocorrências:', error);
      return this.getMockOccurrences();
    }
  }

  // Criar ocorrência
  async createOccurrence(occurrence: Omit<Occurrence, 'id' | 'createdAt' | 'updatedAt'>): Promise<Occurrence> {
    try {
      const response = await api.post('/api/hr/occurrences', occurrence);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar ocorrência:', error);
      throw new Error('Erro ao criar ocorrência');
    }
  }

  // ===== FÉRIAS =====

  // Buscar férias
  async getVacations(filters?: {
    employeeId?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Vacation[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);

      const url = `/api/hr/vacations${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((vacation: VacationAPI) => {
        // Mapear status do backend para o formato do frontend
        let status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' = 'PLANNED';
        if (vacation.status === 'PENDING') {
          status = 'PLANNED';
        } else if (vacation.status === 'APPROVED') {
          // Verificar se está em progresso ou completada baseado nas datas
          const today = new Date();
          const startDate = new Date(vacation.startDate);
          const endDate = new Date(vacation.endDate);
          if (today >= startDate && today <= endDate) {
            status = 'IN_PROGRESS';
          } else if (today > endDate) {
            status = 'COMPLETED';
          } else {
            status = 'PLANNED';
          }
        } else if (vacation.status === 'CANCELLED') {
          status = 'CANCELLED';
        }
        
        return {
          id: vacation.id,
          employeeId: vacation.employeeId,
          employeeName: vacation.employeeName,
          type: vacation.type || 'REGULAR',
          acquisitionPeriod: vacation.acquisitionPeriod || '',
          concessionPeriod: vacation.concessionPeriod || '',
          startDate: vacation.startDate,
          endDate: vacation.endDate,
          days: vacation.daysTaken || vacation.days || 0,
          status: status,
          notes: vacation.notes,
          createdAt: vacation.createdAt,
          updatedAt: vacation.updatedAt
        };
      });
    } catch (error) {
      console.error('Erro ao buscar férias:', error);
      return this.getMockVacations();
    }
  }

  // Criar férias
  async createVacation(vacation: Omit<Vacation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vacation> {
    try {
      const response = await api.post('/api/hr/vacations', vacation);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar férias:', error);
      throw new Error('Erro ao criar férias');
    }
  }

  // ===== BENEFÍCIOS =====

  // Buscar benefícios
  async getBenefits(filters?: {
    type?: string;
    active?: boolean;
  }): Promise<Benefit[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.active !== undefined) params.append('active', filters.active.toString());

      const url = `/hr/benefits${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((benefit: BenefitAPI) => ({
        id: benefit.id,
        name: benefit.name,
        type: benefit.type,
        description: benefit.description,
        value: benefit.value,
        unit: benefit.unit,
        positions: benefit.positions,
        units: benefit.units,
        active: benefit.active,
        createdAt: benefit.createdAt,
        updatedAt: benefit.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar benefícios:', error);
      return this.getMockBenefits();
    }
  }

  // ===== FUNÇÕES =====

  // Buscar funções
  async getJobPositions(filters?: {
    active?: boolean;
  }): Promise<JobPosition[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.active !== undefined) params.append('active', filters.active.toString());

      const url = `/hr/positions${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((position: JobPositionAPI) => ({
        id: position.id,
        title: position.title,
        description: position.description,
        requirements: position.requirements,
        responsibilities: position.responsibilities,
        mandatoryTrainings: position.mandatoryTrainings,
        salaryRange: position.salaryRange,
        benefits: position.benefits,
        active: position.active,
        createdAt: position.createdAt,
        updatedAt: position.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar funções:', error);
      return this.getMockJobPositions();
    }
  }

  // ===== POSTOS DE TRABALHO =====

  // Buscar postos de trabalho
  async getWorkStations(filters?: {
    status?: string;
    unit?: string;
    clientId?: number;
  }): Promise<WorkStation[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.unit) params.append('unit', filters.unit);
      if (filters?.clientId) params.append('clientId', filters.clientId.toString());

      const url = `/hr/work-stations${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((station: WorkStationAPI) => ({
        id: station.id,
        name: station.name,
        description: station.description,
        location: station.location,
        clientId: station.clientId,
        clientName: station.clientName,
        unit: station.unit,
        contractId: station.contractId,
        requiredPositions: station.requiredPositions,
        infrastructure: station.infrastructure,
        status: station.status,
        implantationDate: station.implantationDate,
        checklist: station.checklist,
        createdAt: station.createdAt,
        updatedAt: station.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar postos de trabalho:', error);
      return this.getMockWorkStations();
    }
  }

  // ===== EPIs =====

  // Buscar atribuições de EPI
  async getEPIAssignments(filters?: {
    employeeId?: number;
    status?: string;
  }): Promise<EPIAssignment[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId.toString());
      if (filters?.status) params.append('status', filters.status);

      const url = `/hr/epi-assignments${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((assignment: EPIAssignmentAPI) => ({
        id: assignment.id,
        employeeId: assignment.employeeId,
        employeeName: assignment.employeeName,
        epiId: assignment.epiId,
        epiName: assignment.epiName,
        assignmentDate: assignment.assignmentDate,
        returnDate: assignment.returnDate,
        status: assignment.status,
        digitalSignature: assignment.digitalSignature,
        photoUrl: assignment.photoUrl,
        notes: assignment.notes,
        assignedBy: assignment.assignedBy,
        returnedBy: assignment.returnedBy,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar atribuições de EPI:', error);
      return this.getMockEPIAssignments();
    }
  }

  // ===== LGPD =====

  // Buscar consentimentos LGPD
  async getLGPDConsents(filters?: {
    employeeId?: number;
    active?: boolean;
  }): Promise<LGPDConsent[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId.toString());
      if (filters?.active !== undefined) params.append('active', filters.active.toString());

      const url = `/hr/lgpd-consents${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((consent: LGPDConsentAPI) => ({
        id: consent.id,
        employeeId: consent.employeeId,
        employeeName: consent.employeeName,
        consentDate: consent.consentDate,
        consentType: consent.consentType,
        documentUrl: consent.documentUrl,
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        active: consent.active,
        createdAt: consent.createdAt,
        updatedAt: consent.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar consentimentos LGPD:', error);
      return this.getMockLGPDConsents();
    }
  }

  // ===== ORDENS DE SERVIÇO =====

  // Buscar ordens de serviço
  async getServiceOrders(filters?: {
    employeeId?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ServiceOrder[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);

      const url = `/hr/service-orders${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((order: ServiceOrderAPI) => ({
        id: order.id,
        employeeId: order.employeeId,
        employeeName: order.employeeName,
        function: order.function,
        clientId: order.clientId,
        clientName: order.clientName,
        workStationId: order.workStationId,
        workStationName: order.workStationName,
        startDate: order.startDate,
        endDate: order.endDate,
        status: order.status,
        digitalSignature: order.digitalSignature,
        documentUrl: order.documentUrl,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar ordens de serviço:', error);
      return this.getMockServiceOrders();
    }
  }

  // ===== ESTATÍSTICAS =====

  // Buscar estatísticas de RH
  async getHRStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    onVacation: number;
    onSickLeave: number;
    probationExpiring: number;
    openVacancies: number;
    pendingTransfers: number;
    pendingOccurrences: number;
    pendingVacations: number;
    byStatus: Record<string, number>;
    byUnit: Record<string, number>;
    byPosition: Record<string, number>;
  }> {
    try {
      const response = await api.get('/api/hr/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de RH:', error);
      return this.getMockHRStats();
    }
  }

  // ===== FUNÇÕES AUXILIARES =====

  private mapEmployeeFromAPI(emp: EmployeeAPI): Employee {
    return {
      id: emp.id,
      name: emp.name,
      cpf: emp.cpf,
      rg: emp.rg,
      birthDate: emp.birthDate,
      gender: emp.gender,
      maritalStatus: emp.maritalStatus,
      photoUrl: emp.photoUrl,
      email: emp.email,
      phone: emp.phone,
      address: emp.address,
      bankInfo: emp.bankInfo,
      jobInfo: emp.jobInfo,
      documents: emp.documents,
      emergencyContact: emp.emergencyContact,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt
    };
  }

  // ===== DADOS MOCK =====

  private getMockEmployees(): Employee[] {
    return [
      {
        id: 1,
        name: 'João Silva Santos',
        cpf: '123.456.789-00',
        rg: '12.345.678-9',
        birthDate: '1985-03-15',
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        photoUrl: '/photos/joao_silva.jpg',
        email: 'joao.silva@empresa.com',
        phone: '(11) 99999-9999',
        address: {
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 45',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        },
        bankInfo: {
          bank: 'Banco do Brasil',
          agency: '1234',
          account: '12345-6',
          accountType: 'CHECKING'
        },
        jobInfo: {
          position: 'Vigilante',
          function: 'Segurança Patrimonial',
          unit: 'Unidade Centro',
          admissionDate: '2025-01-15',
          probationEndDate: '2025-03-01',
          contractType: 'EXPERIENCE',
          salary: 1800.00,
          status: 'ACTIVE'
        },
        documents: [
          {
            id: 1,
            type: 'RG',
            number: '12.345.678-9',
            issueDate: '2010-05-20',
            issuingAuthority: 'SSP-SP'
          }
        ],
        emergencyContact: {
          name: 'Maria Silva Santos',
          relationship: 'Esposa',
          phone: '(11) 88888-8888'
        },
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ];
  }

  private getMockJobVacancies(): JobVacancy[] {
    return [
      {
        id: '1',
        title: 'Vigilante Patrimonial',
        position: 'Vigilante',
        function: 'Segurança Patrimonial',
        location: 'São Paulo, SP',
        requirements: ['Ensino Médio Completo', 'Experiência mínima de 1 ano', 'Disponibilidade para trabalhar em horários alternados'],
        workSchedule: '12x36',
        salary: 1800.00,
        benefits: ['Vale Transporte', 'Vale Refeição', 'Assistência Médica', 'Vale Alimentação'],
        deadline: '2025-02-15',
        status: 'OPEN',
        applications: 5,
        createdAt: '2024-01-20T14:30:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
      },
      {
        id: '2',
        title: 'Porteiro',
        position: 'Porteiro',
        function: 'Portaria e Recepção',
        location: 'Belo Horizonte, MG',
        requirements: ['Ensino Médio Completo', 'Boa comunicação', 'Experiência com atendimento ao público'],
        workSchedule: '6x1',
        salary: 1600.00,
        benefits: ['Vale Transporte', 'Vale Refeição', 'Assistência Médica'],
        deadline: '2025-02-20',
        status: 'OPEN',
        applications: 3,
        createdAt: '2024-01-22T10:00:00Z',
        updatedAt: '2024-01-22T10:00:00Z'
      },
      {
        id: '3',
        title: 'Supervisor de Segurança',
        position: 'Supervisor',
        function: 'Supervisão Operacional',
        location: 'Rio de Janeiro, RJ',
        requirements: ['Ensino Superior em Segurança ou áreas afins', 'Experiência mínima de 3 anos', 'CNH categoria B'],
        workSchedule: 'Administrativo',
        salary: 3500.00,
        benefits: ['Vale Transporte', 'Vale Refeição', 'Assistência Médica', 'Vale Alimentação', 'Plano Odontológico'],
        deadline: '2025-02-25',
        status: 'OPEN',
        applications: 8,
        createdAt: '2024-01-25T09:30:00Z',
        updatedAt: '2024-01-25T09:30:00Z'
      },
      {
        id: '4',
        title: 'Controlador de Acesso',
        position: 'Controlador',
        function: 'Controle de Acesso',
        location: 'Brasília, DF',
        requirements: ['Ensino Médio Completo', 'Conhecimento em sistemas de controle', 'Experiência com tecnologia'],
        workSchedule: '8x40',
        salary: 2000.00,
        benefits: ['Vale Transporte', 'Vale Refeição', 'Assistência Médica', 'Participação nos Lucros'],
        deadline: '2025-03-01',
        status: 'OPEN',
        applications: 2,
        createdAt: '2024-01-28T14:15:00Z',
        updatedAt: '2024-01-28T14:15:00Z'
      },
      {
        id: '5',
        title: 'Vigia Noturno',
        position: 'Vigia',
        function: 'Vigilância Noturna',
        location: 'Salvador, BA',
        requirements: ['Ensino Médio Completo', 'Disponibilidade para trabalho noturno', 'Experiência em segurança'],
        workSchedule: '12x36',
        salary: 1900.00,
        benefits: ['Vale Transporte', 'Vale Refeição', 'Assistência Médica', 'Adicional Noturno'],
        deadline: '2025-03-05',
        status: 'OPEN',
        applications: 4,
        createdAt: '2024-01-30T11:45:00Z',
        updatedAt: '2024-01-30T11:45:00Z'
      },
      {
        id: '6',
        title: 'Auxiliar de Facilities',
        position: 'Auxiliar',
        function: 'Facilities e Manutenção',
        location: 'Fortaleza, CE',
        requirements: ['Ensino Fundamental Completo', 'Experiência em limpeza e manutenção', 'Disponibilidade para horários flexíveis'],
        workSchedule: '6x1',
        salary: 1400.00,
        benefits: ['Vale Transporte', 'Vale Refeição', 'Assistência Médica'],
        deadline: '2025-03-10',
        status: 'OPEN',
        applications: 6,
        createdAt: '2024-02-01T08:20:00Z',
        updatedAt: '2024-02-01T08:20:00Z'
      }
    ];
  }

  private getMockTransfers(): Transfer[] {
    return [
      {
        id: 1,
        employeeId: 1,
        employeeName: 'João Silva Santos',
        fromPosition: 'Vigilante',
        toPosition: 'Vigilante',
        fromUnit: 'Unidade Norte',
        toUnit: 'Unidade Centro',
        fromFunction: 'Segurança Patrimonial',
        toFunction: 'Segurança Patrimonial',
        reason: 'Necessidade operacional',
        transferDate: '2025-01-25',
        approvedBy: 'admin@empresa.com',
        status: 'APPROVED',
        notes: 'Transferência aprovada pelo gerente',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-25T14:30:00Z'
      }
    ];
  }

  private getMockOccurrences(): Occurrence[] {
    return [
      {
        id: 1,
        employeeId: 1,
        employeeName: 'João Silva Santos',
        type: 'MEDICAL_CERTIFICATE',
        description: 'Atestado médico por gripe',
        date: '2025-01-22',
        duration: 3,
        documentUrl: '/documents/atestado_joao.pdf',
        status: 'APPROVED',
        approvedBy: 'rh@empresa.com',
        approvedAt: '2024-01-23T09:00:00Z',
        notes: 'Atestado aprovado',
        createdAt: '2024-01-22T08:00:00Z',
        updatedAt: '2024-01-23T09:00:00Z'
      }
    ];
  }

  private getMockVacations(): Vacation[] {
    return [
      {
        id: 1,
        employeeId: 1,
        employeeName: 'João Silva Santos',
        type: 'REGULAR',
        acquisitionPeriod: '2025',
        concessionPeriod: '2025',
        startDate: '2025-02-01',
        endDate: '2025-02-28',
        days: 30,
        status: 'PLANNED',
        notes: 'Férias programadas',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ];
  }

  private getMockBenefits(): Benefit[] {
    return [
      {
        id: 1,
        name: 'Vale Transporte',
        type: 'TRANSPORT',
        description: 'Auxílio transporte para todos os funcionários',
        value: 200.00,
        unit: 'FIXED',
        positions: ['Vigilante', 'Porteiro', 'ASG'],
        units: ['Unidade Centro', 'Unidade Norte', 'Unidade Sul'],
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  }

  private getMockJobPositions(): JobPosition[] {
    return [
      {
        id: 1,
        title: 'Vigilante',
        description: 'Responsável pela segurança patrimonial',
        requirements: ['Ensino Médio Completo', 'Curso de Vigilante'],
        responsibilities: ['Patrulhamento', 'Controle de acesso', 'Segurança patrimonial'],
        mandatoryTrainings: ['NR-35', 'Primeiros Socorros'],
        salaryRange: {
          min: 1500.00,
          max: 2500.00
        },
        benefits: ['Vale Transporte', 'Vale Refeição'],
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  }

  private getMockWorkStations(): WorkStation[] {
    return [
      {
        id: 1,
        name: 'Posto Shopping Centro',
        description: 'Posto de trabalho no shopping center',
        location: 'Shopping Centro - São Paulo, SP',
        clientId: 1,
        clientName: 'Shopping Centro Ltda',
        unit: 'Unidade Centro',
        contractId: 1,
        requiredPositions: [
          { position: 'Vigilante', quantity: 4 },
          { position: 'Porteiro', quantity: 2 }
        ],
        infrastructure: ['Sala de controle', 'Posto de vigilância'],
        status: 'ACTIVE',
        implantationDate: '2024-01-01',
        checklist: {
          infrastructure: true,
          hr: true,
          epi: true,
          training: true
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  }

  private getMockEPIAssignments(): EPIAssignment[] {
    return [
      {
        id: 1,
        employeeId: 1,
        employeeName: 'João Silva Santos',
        epiId: 1,
        epiName: 'Capacete de Segurança',
        assignmentDate: '2024-01-15',
        status: 'ASSIGNED',
        notes: 'EPI entregue no primeiro dia',
        assignedBy: 'admin@empresa.com',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ];
  }

  private getMockLGPDConsents(): LGPDConsent[] {
    return [
      {
        id: 1,
        employeeId: 1,
        employeeName: 'João Silva Santos',
        consentDate: '2024-01-15',
        consentType: 'DATA_PROCESSING',
        documentUrl: '/documents/lgpd_consent_joao.pdf',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        active: true,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ];
  }

  private getMockServiceOrders(): ServiceOrder[] {
    return [
      {
        id: 1,
        employeeId: 1,
        employeeName: 'João Silva Santos',
        function: 'Segurança Patrimonial',
        clientId: 1,
        clientName: 'Shopping Centro Ltda',
        workStationId: 1,
        workStationName: 'Posto Shopping Centro',
        startDate: '2024-01-15',
        status: 'ACTIVE',
        documentUrl: '/documents/service_order_joao.pdf',
        notes: 'Ordem de serviço ativa',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ];
  }

  private getMockHRStats() {
    return {
      totalEmployees: 150,
      activeEmployees: 145,
      onVacation: 3,
      onSickLeave: 2,
      probationExpiring: 5,
      openVacancies: 8,
      pendingTransfers: 2,
      pendingOccurrences: 3,
      pendingVacations: 4,
      byStatus: {
        ACTIVE: 145,
        VACATION: 3,
        SICK_LEAVE: 2
      },
      byUnit: {
        'Unidade Centro': 50,
        'Unidade Norte': 45,
        'Unidade Sul': 40,
        'Unidade Leste': 15
      },
      byPosition: {
        'Vigilante': 80,
        'Porteiro': 30,
        'ASG': 25,
        'Recepcionista': 15
      }
    };
  }
}

export default new HRService(); 