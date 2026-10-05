import api from '../lib/axios';
import { 
  FeriasPeriodo, 
  Afastamento, 
  CreateFeriasRequest, 
  UpdateFeriasRequest, 
  CreateAfastamentoRequest, 
  UpdateAfastamentoRequest,
  FeriasFilters,
  AfastamentoFilters,
  PeriodoAquisitivo,
  SaldoFerias,
  ValidacaoFerias,
  ValidacaoFeriasRequest,
  FeriasBloco,
  FeriasColetiva,
  CreateFeriasColetivaRequest,
  ResultadoProcessamentoColetiva,
  AlertaConcessivo
} from '../types/ferias';

/** Shape minimo do DTO de vacation retornado pela API (portal do colaborador). */
interface VacationPortalDTO {
  id?: string;
  startDate?: string;
  endDate?: string;
  daysTaken?: number;
  status?: string;
  vacationType?: string;
  observacoes?: string;
  approvedByName?: string;
  approvalDate?: string;
  motivoRejeicao?: string;
  diasAbono?: number;
  periodoAquisitivoInicio?: string;
  periodoAquisitivoFim?: string;
  createdAt?: string;
}

export const feriasService = {
  // ---------------------------------------------------------------------------
  // Período Aquisitivo (CLT Art. 129-137)
  // ---------------------------------------------------------------------------

  async getPeriodosAquisitivos(employeeId: string): Promise<PeriodoAquisitivo[]> {
    const response = await api.get(`/api/periodo-aquisitivo/employee/${employeeId}`);
    return response.data;
  },

  async getPeriodoAquisitivoAtivo(employeeId: string): Promise<PeriodoAquisitivo> {
    const response = await api.get(`/api/periodo-aquisitivo/ativo/${employeeId}`);
    return response.data;
  },

  async getSaldoFerias(employeeId: string): Promise<SaldoFerias> {
    const response = await api.get(`/api/periodo-aquisitivo/saldo/${employeeId}`);
    return response.data;
  },

  /**
   * Valida uma solicitação de férias sem persistir (RF-02 / RF-03 / RF-05).
   * Retorna violações (bloqueiam) e alertas (informativos).
   */
  async validarSolicitacao(request: ValidacaoFeriasRequest): Promise<ValidacaoFerias> {
    const response = await api.post('/api/vacations/validation', request);
    return response.data;
  },


  // Férias
  async getFerias(filters: FeriasFilters = {}): Promise<FeriasPeriodo[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/vacations?${params.toString()}`);
    // Converter dados do backend para o formato esperado pelo frontend
    return response.data.map((vacation: any) => ({
      id: vacation.id,
      employeeId: vacation.employeeId,
      employeeName: vacation.employeeName || 'Funcionário não encontrado',
      periodoAquisitivo: vacation.periodoAquisitivoInicio
        ? `${new Date(vacation.periodoAquisitivoInicio).getFullYear()}/${new Date(vacation.periodoAquisitivoFim).getFullYear()}`
        : `${new Date(vacation.startDate).getFullYear()}/${new Date(vacation.startDate).getFullYear() + 1}`,
      periodoAquisitivoId: vacation.periodoAquisitivoId || null,
      dataInicio: vacation.startDate,
      dataFim: vacation.endDate,
      status: vacation.status === 'PENDING' ? 'PENDENTE' : 
              vacation.status === 'APPROVED' ? 'APROVADO' : 
              vacation.status === 'REJECTED' ? 'REJECTED' :
              vacation.status === 'CANCELLED' ? 'CANCELADO' : 'PENDENTE',
      tipo: vacation.vacationType === 'SOLD' ? 'FERIAS_VENDIDAS' :
            vacation.vacationType === 'PECUNIARY_BONUS' ? 'ABONO_PECUNIARIO' : 
            vacation.vacationType === 'NORMAL' ? 'FERIAS_NORMAIS' : 'FERIAS_NORMAIS', // Valor padrão
      diasAbono: vacation.diasAbono || 0,
      blocos: vacation.blocos || null,
      observacoes: vacation.observacoes || '',
      createdAt: vacation.createdAt
    }));
  },

  async getFeriasById(id: string): Promise<FeriasPeriodo> {
    const response = await api.get(`/api/vacations/${id}`);
    const vacation = response.data;
    // Converter dados do backend para o formato esperado pelo frontend
    return {
      id: vacation.id,
      employeeId: vacation.employeeId || vacation.employee?.id,
      employeeName: vacation.employeeName || vacation.employee?.name || 'Funcionário não encontrado',
      periodoAquisitivo: vacation.periodoAquisitivoInicio
        ? `${new Date(vacation.periodoAquisitivoInicio).getFullYear()}/${new Date(vacation.periodoAquisitivoFim).getFullYear()}`
        : `${new Date(vacation.startDate).getFullYear()}/${new Date(vacation.startDate).getFullYear() + 1}`,
      periodoAquisitivoId: vacation.periodoAquisitivoId || null,
      dataInicio: vacation.startDate,
      dataFim: vacation.endDate,
      status: vacation.status === 'PENDING' ? 'PENDENTE' : 
              vacation.status === 'APPROVED' ? 'APROVADO' : 
              vacation.status === 'REJECTED' ? 'REJECTED' :
              vacation.status === 'CANCELLED' ? 'CANCELADO' : 'PENDENTE',
      tipo: vacation.vacationType === 'SOLD' ? 'FERIAS_VENDIDAS' :
            vacation.vacationType === 'PECUNIARY_BONUS' ? 'ABONO_PECUNIARIO' : 'FERIAS_NORMAIS', // Valor padrão
      diasAbono: vacation.diasAbono || 0,
      blocos: vacation.blocos || null,
      observacoes: vacation.observacoes || vacation.notes || '',
      createdAt: vacation.createdAt,
      updatedAt: vacation.updatedAt
    };
  },

  async getFeriasByEmployee(employeeId: string): Promise<FeriasPeriodo[]> {
    const response = await api.get(`/api/vacations/employee/${employeeId}`);
    return response.data;
  },

  async createFerias(data: CreateFeriasRequest): Promise<FeriasPeriodo> {
    // Converter dados do frontend para o formato esperado pelo backend
    const startDate = new Date(data.dataInicio).toISOString().split('T')[0];
    const endDate = new Date(data.dataFim).toISOString().split('T')[0];
    
    // Mapear tipo do frontend para o backend
    const tipoMap: Record<string, string> = {
      'FERIAS_NORMAIS': 'NORMAL',
      'FERIAS_VENDIDAS': 'SOLD',
      'ABONO_PECUNIARIO': 'PECUNIARY_BONUS'
    };
    
    const backendData = {
      employeeId: data.employeeId,
      startDate: startDate,
      endDate: endDate,
      daysTaken: Math.ceil((new Date(data.dataFim).getTime() - new Date(data.dataInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1,
      remainingDays: 30, // Valor padrão - será recalculado pelo backend
      status: 'PENDING',
      vacationType: tipoMap[data.tipo] || 'NORMAL',
      // Extensão CLT (Fase 1)
      periodoAquisitivo: data.periodoAquisitivoId ? { id: data.periodoAquisitivoId } : undefined,
      blocos: data.blocos && data.blocos.length > 0 ? data.blocos : undefined,
      numeroBlocos: data.blocos && data.blocos.length > 0 ? data.blocos.length : 1,
      diasAbono: data.diasAbono || 0,
      observacoes: data.observacoes || null
    };
    const response = await api.post('/api/vacations', backendData);
    return response.data;
  },

  async updateFerias(id: string, data: UpdateFeriasRequest): Promise<FeriasPeriodo> {
    // Primeiro, buscar o registro existente para obter os dados completos
    const existingVacation = await this.getFeriasById(id);
    
    // Converter dados do frontend para o formato esperado pelo backend
    const startDate = data.dataInicio ? new Date(data.dataInicio).toISOString().split('T')[0] : existingVacation.dataInicio;
    const endDate = data.dataFim ? new Date(data.dataFim).toISOString().split('T')[0] : existingVacation.dataFim;
    
    // Calcular dias
    let daysTaken = 0;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      daysTaken = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    // Mapear status do frontend para o backend
    // O backend só aceita: PENDING, APPROVED, REJECTED, CANCELLED
    const statusMap: Record<string, string> = {
      'PENDENTE': 'PENDING',
      'APROVADO': 'APPROVED',
      'REJECTED': 'REJECTED',
      'REJEITADO': 'REJECTED',
      'CANCELADO': 'CANCELLED',
      // Mapear valores antigos para valores válidos
      'EM_ANDAMENTO': 'PENDING', // Mapear para PENDING se não houver equivalente
      'CONCLUIDO': 'APPROVED' // Mapear para APPROVED se não houver equivalente
    };
    
    // Mapear tipo do frontend para o backend
    const tipoMap: Record<string, string> = {
      'FERIAS_NORMAIS': 'NORMAL',
      'FERIAS_VENDIDAS': 'SOLD',
      'ABONO_PECUNIARIO': 'PECUNIARY_BONUS'
    };
    
    // Preparar dados no formato que o backend espera (objeto Vacation completo)
    // O backend precisa de todos os campos obrigatórios, incluindo employee como objeto
    const backendData: any = {
      id: id,
      employee: {
        id: existingVacation.employeeId // Enviar employee como objeto com apenas o id
      },
      startDate: startDate,
      endDate: endDate,
      daysTaken: daysTaken,
      remainingDays: Math.max(1, 30 - daysTaken), // Calcular dias restantes
      status: data.status ? statusMap[data.status] || statusMap[existingVacation.status] || 'PENDING' : statusMap[existingVacation.status] || 'PENDING', // Usar status do formulário se fornecido
      vacationType: data.tipo ? tipoMap[data.tipo] || 'NORMAL' : (existingVacation.tipo ? tipoMap[existingVacation.tipo] : 'NORMAL') // Usar tipo do formulário se fornecido
    };
    
    const response = await api.put(`/api/vacations/${id}`, backendData);
    
    // Converter resposta do backend para o formato esperado pelo frontend
    const vacation = response.data;
    return {
      id: vacation.id,
      employeeId: vacation.employeeId || vacation.employee?.id,
      employeeName: vacation.employeeName || vacation.employee?.name || 'Funcionário não encontrado',
      periodoAquisitivo: `${new Date(vacation.startDate).getFullYear()}/${new Date(vacation.startDate).getFullYear() + 1}`,
      dataInicio: vacation.startDate,
      dataFim: vacation.endDate,
      status: vacation.status === 'PENDING' ? 'PENDENTE' : 
              vacation.status === 'APPROVED' ? 'APROVADO' : 
              vacation.status === 'REJECTED' ? 'REJECTED' :
              vacation.status === 'CANCELLED' ? 'CANCELADO' : 'PENDENTE',
      tipo: data.tipo || existingVacation.tipo || 'FERIAS_NORMAIS', // Preservar tipo do formulário ou existente
      observacoes: data.observacoes || existingVacation.observacoes || '',
      createdAt: vacation.createdAt,
      updatedAt: vacation.updatedAt
    };
  },

  async deleteFerias(id: string): Promise<void> {
    await api.delete(`/api/vacations/${id}`);
  },

  async approveFerias(id: string, observacoes?: string): Promise<FeriasPeriodo> {
    const response = await api.put(`/api/vacations/${id}/approve`, { observacoes });
    return response.data;
  },

  async rejectFerias(id: string, motivo: string): Promise<FeriasPeriodo> {
    // O backend espera "observacoes" em vez de "motivo"
    const response = await api.put(`/api/vacations/${id}/reject`, { observacoes: motivo });
    return response.data;
  },

  // Afastamentos
  async getAfastamentos(filters: AfastamentoFilters = {}): Promise<Afastamento[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/absences?${params.toString()}`);
    
    // Mapear tipos do backend (inglês) para frontend (português)
    const tipoMapInverso: Record<string, string> = {
      'SICK_LEAVE': 'ATESTADO',
      'MEDICAL_APPOINTMENT': 'ATESTADO',
      'PERSONAL_LEAVE': 'LICENCA_MEDICA',
      'UNAUTHORIZED': 'SUSPENSAO',
      'OTHER': 'OUTROS',
      'WEDDING': 'OUTROS',
      'FAMILY_EMERGENCY': 'OUTROS'
    };
    
    // Converter dados do backend para o formato esperado pelo frontend
    return response.data.map((absence: any) => ({
      id: absence.id,
      employeeId: absence.employee?.id || absence.employeeId || null,
      employeeName: absence.employee?.name || absence.employeeName || 'Funcionário não encontrado',
      tipo: tipoMapInverso[absence.absenceType] || 'OUTROS',
      dataInicio: absence.absenceDate, // Usar absenceDate em vez de startDate
      dataFim: (() => {
        // Calcular data fim baseado em medicalCertificateDays
        if (absence.medicalCertificateDays && absence.medicalCertificateDays > 1) {
          const startDate = new Date(absence.absenceDate);
          startDate.setDate(startDate.getDate() + absence.medicalCertificateDays - 1);
          return startDate.toISOString().split('T')[0];
        }
        return absence.absenceDate; // Se não houver medicalCertificateDays, usar a mesma data
      })(),
      status: absence.status === 'PENDING' ? 'PENDENTE' :
              absence.status === 'APPROVED' ? 'APROVADO' :
              absence.status === 'REJECTED' ? 'CANCELADO' :
              absence.status === 'CANCELLED' ? 'CANCELADO' : 'PENDENTE',
      motivo: absence.reason || '',
      documento: absence.documentUrl || '',
      observacoes: absence.coverageNotes || '',
      createdAt: absence.createdAt
    }));
  },

  async getAfastamentoById(id: string): Promise<Afastamento> {
    const response = await api.get(`/api/absences/${id}`);
    const absence = response.data;
    
    // Converter dados do backend para o formato esperado pelo frontend
    const tipoMapInverso: Record<string, string> = {
      'SICK_LEAVE': 'ATESTADO',
      'MEDICAL_APPOINTMENT': 'ATESTADO',
      'PERSONAL_LEAVE': 'LICENCA_MEDICA',
      'UNAUTHORIZED': 'SUSPENSAO',
      'OTHER': 'OUTROS',
      'WEDDING': 'OUTROS',
      'FAMILY_EMERGENCY': 'OUTROS'
    };
    
    // Calcular data fim baseado em medicalCertificateDays ou usar absenceDate
    const dataInicio = absence.absenceDate;
    let dataFim = absence.absenceDate;
    if (absence.medicalCertificateDays && absence.medicalCertificateDays > 1) {
      const startDate = new Date(dataInicio);
      startDate.setDate(startDate.getDate() + absence.medicalCertificateDays - 1);
      dataFim = startDate.toISOString().split('T')[0];
    }
    
    return {
      id: absence.id,
      employeeId: absence.employee?.id || absence.employeeId || null,
      employeeName: absence.employee?.name || absence.employeeName || 'Funcionário não encontrado',
      tipo: tipoMapInverso[absence.absenceType] || 'OUTROS',
      dataInicio: dataInicio,
      dataFim: dataFim,
      status: absence.status === 'PENDING' ? 'PENDENTE' :
              absence.status === 'APPROVED' ? 'APROVADO' :
              absence.status === 'REJECTED' ? 'CANCELADO' :
              absence.status === 'CANCELLED' ? 'CANCELADO' : 'PENDENTE',
      motivo: absence.reason || '',
      documento: absence.documentUrl || '',
      observacoes: absence.coverageNotes || '',
      createdAt: absence.createdAt,
      updatedAt: absence.updatedAt
    };
  },

  async getAfastamentosByEmployee(employeeId: string): Promise<Afastamento[]> {
    const response = await api.get(`/api/absences/employee/${employeeId}`);
    return response.data;
  },

  async createAfastamento(data: CreateAfastamentoRequest): Promise<Afastamento> {
    // Mapear tipos do frontend (português) para backend (inglês)
    const tipoMap: Record<string, string> = {
      'ATESTADO': 'SICK_LEAVE',
      'LICENCA_MEDICA': 'SICK_LEAVE',
      'LICENCA_MATERNIDADE': 'PERSONAL_LEAVE',
      'LICENCA_PATERNIDADE': 'PERSONAL_LEAVE',
      'SUSPENSAO': 'UNAUTHORIZED',
      'OUTROS': 'OTHER'
    };

    // Calcular medicalCertificateDays baseado na diferença entre dataInicio e dataFim
    let medicalCertificateDays = 1;
    if (data.dataInicio && data.dataFim) {
      const startDate = new Date(data.dataInicio);
      const endDate = new Date(data.dataFim);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      medicalCertificateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    
    // Converter dados do frontend para o formato do backend
    const backendData = {
      employeeId: data.employeeId,
      absenceType: tipoMap[data.tipo] || 'OTHER', // Mapear tipo do frontend para absenceType do backend
      absenceDate: data.dataInicio, // Usar dataInicio como absenceDate
      medicalCertificateDays: medicalCertificateDays, // Incluir número de dias
      status: 'PENDING', // Status inicial
      reason: data.motivo,
      documentUrl: data.documento || null,
      coverageNotes: data.observacoes || null,
      isJustified: true
    };
    
    const response = await api.post('/api/absences', backendData);
    return response.data;
  },

  async updateAfastamento(id: string, data: UpdateAfastamentoRequest): Promise<Afastamento> {
    // Mapear tipos do frontend (português) para backend (inglês)
    const tipoMap: Record<string, string> = {
      'ATESTADO': 'SICK_LEAVE',
      'LICENCA_MEDICA': 'SICK_LEAVE',
      'LICENCA_MATERNIDADE': 'PERSONAL_LEAVE',
      'LICENCA_PATERNIDADE': 'PERSONAL_LEAVE',
      'SUSPENSAO': 'UNAUTHORIZED',
      'OUTROS': 'OTHER'
    };

    // Mapear status do frontend (português) para backend (inglês)
    const statusMap: Record<string, string> = {
      'PENDENTE': 'PENDING',
      'APROVADO': 'APPROVED',
      'CANCELADO': 'CANCELLED',
      'REJECTED': 'REJECTED',
      'REJEITADO': 'REJECTED',
      'EM_ANDAMENTO': 'PENDING', // Mapear para PENDING se não houver equivalente
      'CONCLUIDO': 'APPROVED' // Mapear para APPROVED se não houver equivalente
    };

    // Calcular medicalCertificateDays baseado na diferença entre dataInicio e dataFim
    let medicalCertificateDays = 1;
    if (data.dataInicio && data.dataFim) {
      const startDate = new Date(data.dataInicio);
      const endDate = new Date(data.dataFim);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      medicalCertificateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    
    // Converter dados do frontend para o formato do backend (AbsenceDTO)
    // IMPORTANTE: Sempre incluir absenceType quando fornecido
    const backendData: any = {
      employeeId: data.employeeId || undefined, // Manter employeeId se fornecido
      absenceDate: data.dataInicio || undefined, // Usar dataInicio como absenceDate
      medicalCertificateDays: medicalCertificateDays, // Incluir número de dias
      reason: data.motivo || undefined,
      documentUrl: data.documento || undefined,
      coverageNotes: data.observacoes || undefined,
      isJustified: true
    };
    
    // CRÍTICO: Sempre incluir absenceType quando data.tipo estiver presente
    // O backend precisa receber este campo para atualizar corretamente
    if (data.tipo) {
      const mappedType = tipoMap[data.tipo] || 'OTHER';
      backendData.absenceType = mappedType;
      console.log('🔄 Mapeando tipo do frontend:', data.tipo, '-> backend:', mappedType);
    } else {
      console.warn('⚠️ Tipo não fornecido no updateData - campo tipo pode não ser atualizado');
    }
    
    // Sempre incluir status se fornecido
    if (data.status) {
      backendData.status = statusMap[data.status] || 'PENDING';
    }
    
    const response = await api.put(`/api/absences/${id}`, backendData);
    
    // Converter resposta do backend para o formato esperado pelo frontend
    const absence = response.data;
    const tipoMapInverso: Record<string, string> = {
      'SICK_LEAVE': 'ATESTADO',
      'MEDICAL_APPOINTMENT': 'ATESTADO',
      'PERSONAL_LEAVE': 'LICENCA_MEDICA',
      'UNAUTHORIZED': 'SUSPENSAO',
      'OTHER': 'OUTROS',
      'WEDDING': 'OUTROS',
      'FAMILY_EMERGENCY': 'OUTROS'
    };
    
    return {
      id: absence.id,
      employeeId: absence.employeeId || absence.employee?.id || null,
      employeeName: absence.employeeName || absence.employee?.name || 'Funcionário não encontrado',
      tipo: tipoMapInverso[absence.absenceType] || 'OUTROS',
      dataInicio: absence.absenceDate,
      dataFim: (() => {
        // Calcular data fim baseado em medicalCertificateDays
        if (absence.medicalCertificateDays && absence.medicalCertificateDays > 1) {
          const startDate = new Date(absence.absenceDate);
          startDate.setDate(startDate.getDate() + absence.medicalCertificateDays - 1);
          return startDate.toISOString().split('T')[0];
        }
        return absence.absenceDate; // Se não houver medicalCertificateDays, usar a mesma data
      })(),
      status: absence.status === 'PENDING' ? 'PENDENTE' :
              absence.status === 'APPROVED' ? 'APROVADO' :
              absence.status === 'REJECTED' ? 'CANCELADO' :
              absence.status === 'CANCELLED' ? 'CANCELADO' : 'PENDENTE',
      motivo: absence.reason || '',
      documento: absence.documentUrl || '',
      observacoes: absence.coverageNotes || '',
      createdAt: absence.createdAt
    };
  },

  async deleteAfastamento(id: string): Promise<void> {
    await api.delete(`/api/absences/${id}`);
  },

  async approveAfastamento(id: string, observacoes?: string): Promise<Afastamento> {
    const response = await api.put(`/api/absences/${id}/approve`, { observacoes });
    return response.data;
  },

  async rejectAfastamento(id: string, motivo: string): Promise<Afastamento> {
    // O backend espera "observacoes" em vez de "motivo"
    const response = await api.put(`/api/absences/${id}/reject`, { observacoes: motivo });
    return response.data;
  },

  // Relatórios e Estatísticas
  async getFeriasStats(): Promise<{
    total: number;
    pendentes: number;
    aprovadas: number;
    rejeitadas: number;
    canceladas: number;
  }> {
    const response = await api.get('/api/reports/ferias/stats/ferias');
    return response.data;
  },

  async getAfastamentosStats(): Promise<{
    total: number;
    pendentes: number;
    aprovados: number;
    rejeitados: number;
    cancelados: number;
  }> {
    const response = await api.get('/api/reports/ferias/stats/afastamentos');
    return response.data;
  },

  async getAllStats(): Promise<{
    ferias: any;
    afastamentos: any;
  }> {
    const response = await api.get('/api/reports/ferias/stats');
    return response.data;
  },

  // Exportação
  async exportFerias(filters: FeriasFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/reports/ferias/ferias/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async exportAfastamentos(filters: AfastamentoFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/reports/ferias/afastamentos/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async exportConsolidado(filters: FeriasFilters & AfastamentoFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/reports/ferias/consolidado/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Portal do Funcionario (RF-06) - Fase 2
  // ---------------------------------------------------------------------------

  /** Employee id autenticado no portal do colaborador. */
  getEmployeeIdPortal(): string | null {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      return user?.employeeId || user?.employee_id || null;
    } catch {
      return null;
    }
  },
  /** Extrai a mensagem de erro devolvida pelo backend (validacoes CLT inclusive). */
  extrairMensagemErro(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
      const data = response?.data;
      if (data?.message) return data.message;
      if (data?.error) return data.error;
    }
    if (err instanceof Error && err.message) return err.message;
    return 'Nao foi possivel concluir a operacao. Tente novamente.';
  },

  async getMinhasSolicitacoes(): Promise<any[]> {
    const employeeId = this.getEmployeeIdPortal();
    if (!employeeId) return [];
    try {
      const response = await api.get(`/api/vacations/employee/${employeeId}`);
      return (response.data || []).map((v: VacationPortalDTO) => ({
        id: v.id,
        dataInicio: v.startDate,
        dataFim: v.endDate,
        dias: v.daysTaken,
        status: v.status,
        tipo: 'VACATION',
        observacao: v.observacoes || '',
        aprovador: v.approvedByName || '',
        dataAprovacao: v.approvalDate || '',
        motivoRejeicao: v.motivoRejeicao || '',
        diasAbono: v.diasAbono || 0,
        periodoAquisitivo: v.periodoAquisitivoInicio
          ? `${new Date(v.periodoAquisitivoInicio).getFullYear()}/${new Date(v.periodoAquisitivoFim).getFullYear()}`
          : '',
        createdAt: v.createdAt
      }));
    } catch {
      return [];
    }
  },

  async getMeuSaldo(): Promise<any> {
    const employeeId = this.getEmployeeIdPortal();
    const periodoAtual = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    const vazio = {
      diasDisponiveis: 0,
      diasUsados: 0,
      diasUtilizados: 0,
      diasTotais: 0,
      diasEmAndamento: 0,
      periodoAquisitivo: periodoAtual,
      proximaAquisicao: '',
      proximoPeriodo: '',
      limiteConcessivo: '',
      solicitacoes: []
    };
    if (!employeeId) return vazio;
    try {
      const [balance, solicitacoes] = await Promise.all([
        api.get(`/api/vacations/employee/${employeeId}/balance`).then(r => r.data).catch(() => null),
        api.get(`/api/vacations/employee/${employeeId}`).then(r => r.data || []).catch(() => [])
      ]);
      if (!balance) return vazio;
      return {
        diasDisponiveis: balance.availableDays ?? 0,
        diasUsados: balance.usedDays ?? 0,
        // aliases lidos pelo componente do portal
        diasUtilizados: balance.usedDays ?? 0,
        diasTotais: balance.totalDays ?? 0,
        diasEmAndamento: balance.daysInProgress ?? 0,
        periodoAquisitivo: balance.period || periodoAtual,
        proximaAquisicao: balance.nextAcquisitionDate || '',
        proximoPeriodo: balance.nextAcquisitionDate || '',
        limiteConcessivo: balance.nextVacationLimitDate || '',
        solicitacoes: solicitacoes || []
      };
    } catch {
      return vazio;
    }
  },

  /**
   * Solicitacao do portal: vincula o PA vigente, envia o colaborador e
   * devolve as violacoes CLT do backend como Error legivel (RF-06).
   */
  async solicitarFerias(data: {
    dataInicio: string;
    dataFim: string;
    observacao?: string;
    tipo?: string;
    diasAbono?: number;
  }): Promise<any> {
    const employeeId = this.getEmployeeIdPortal();
    if (!employeeId) {
      throw new Error('Colaborador nao identificado. Faca login novamente.');
    }

    let periodoAquisitivoId: string | undefined;
    try {
      const pa = await api.get(`/api/periodo-aquisitivo/ativo/${employeeId}`);
      periodoAquisitivoId = pa.data?.id;
    } catch {
      // Sem PA aberto o backend resolve o vigente na criacao
    }

    const tipoMap: Record<string, string> = {
      FERIAS_NORMAIS: 'NORMAL',
      FERIAS_VENDIDAS: 'SOLD',
      ABONO_PECUNIARIO: 'PECUNIARY_BONUS'
    };

    const dias = Math.max(
      1,
      Math.ceil(
        (new Date(data.dataFim).getTime() - new Date(data.dataInicio).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );

    try {
      const response = await api.post('/api/vacations', {
        employeeId,
        startDate: data.dataInicio,
        endDate: data.dataFim,
        daysTaken: dias + (data.diasAbono || 0),
        status: 'PENDING',
        vacationType: tipoMap[data.tipo || ''] || 'NORMAL',
        diasAbono: data.diasAbono || 0,
        periodoAquisitivo: periodoAquisitivoId ? { id: periodoAquisitivoId } : undefined,
        observacoes: data.observacao || ''
      });
      return response.data;
    } catch (err) {
      throw new Error(this.extrairMensagemErro(err));
    }
  },

  async cancelarSolicitacao(id: string): Promise<void> {
    await api.delete(`/api/vacations/${id}`);
  },

  // ---------------------------------------------------------------------------
  // Ferias Coletivas (RF-04) - Fase 2
  // ---------------------------------------------------------------------------

  async getColetivas(): Promise<FeriasColetiva[]> {
    const response = await api.get('/api/ferias-coletivas');
    return response.data || [];
  },

  async createColetiva(data: CreateFeriasColetivaRequest): Promise<FeriasColetiva> {
    try {
      const response = await api.post('/api/ferias-coletivas', data);
      return response.data;
    } catch (err) {
      throw new Error(this.extrairMensagemErro(err));
    }
  },

  async updateColetiva(id: string, data: CreateFeriasColetivaRequest): Promise<FeriasColetiva> {
    try {
      const response = await api.put(`/api/ferias-coletivas/${id}`, data);
      return response.data;
    } catch (err) {
      throw new Error(this.extrairMensagemErro(err));
    }
  },

  async cancelarColetiva(id: string): Promise<void> {
    try {
      await api.post(`/api/ferias-coletivas/${id}/cancelar`);
    } catch (err) {
      throw new Error(this.extrairMensagemErro(err));
    }
  },

  async excluirColetiva(id: string): Promise<void> {
    try {
      await api.delete(`/api/ferias-coletivas/${id}`);
    } catch (err) {
      throw new Error(this.extrairMensagemErro(err));
    }
  },

  /** Processa a coletiva em massa e devolve o resumo (RF-04). */
  async processarColetiva(id: string): Promise<ResultadoProcessamentoColetiva> {
    try {
      const response = await api.post(`/api/ferias-coletivas/${id}/processar`);
      return response.data;
    } catch (err) {
      throw new Error(this.extrairMensagemErro(err));
    }
  },

  async concluirColetiva(id: string): Promise<FeriasColetiva> {
    try {
      const response = await api.post(`/api/ferias-coletivas/${id}/concluir`);
      return response.data;
    } catch (err) {
      throw new Error(this.extrairMensagemErro(err));
    }
  },

  // ---------------------------------------------------------------------------
  // Alertas de periodo concessivo (RF-07) - Fase 2
  // ---------------------------------------------------------------------------

  /** PAs com limite concessivo vencendo ate a data informada (padrao 90 dias). */
  async getAlertasConcessivo(ate?: string): Promise<AlertaConcessivo[]> {
    const params = ate ? `?ate=${ate}` : '';
    const response = await api.get(`/api/periodo-aquisitivo/alertas${params}`);
    return response.data || [];
  }
}; 