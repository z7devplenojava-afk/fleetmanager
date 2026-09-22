import api from '@/lib/axios';

/**
 * Remove strings vazias e objetos que ficam vazios após a limpeza (ex.: `{ id: '' }`),
 * para o Jackson não falhar em UUID/LocalDate no POST/PUT de funcionários.
 */
function sanitizeEmployeeWritePayload(raw: Record<string, unknown>): Record<string, unknown> {
  const walk = (v: unknown): unknown => {
    if (v === '') return undefined;
    if (Array.isArray(v)) {
      return v.map(walk).filter((x) => x !== undefined);
    }
    if (v !== null && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(o)) {
        const c = walk(val);
        if (c === undefined) continue;
        out[k] = c;
      }
      if (Object.keys(out).length === 0) return undefined;
      return out;
    }
    return v;
  };
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(raw)) {
    const c = walk(val);
    if (c === undefined) continue;
    out[k] = c;
  }
  return out;
}

export interface Employee {
  id: string;
  name: string;
  cpf?: string;
  document?: string;
  birthDate?: string;
  registrationNumber?: string;
  hireDate?: string;
  terminationDate?: string;
  status?: string;
  notes?: string;
  address?: string;
  phone?: string;
  email?: string;
  cnhNumber?: string;
  cnhCategory?: string;
  cnhExpirationDate?: string;
  positionDescription?: string;
  ctps?: string;
  cbo?: string;
  pis?: string;
  salario?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SimpleEmployee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
}

export const employeeService = {
  /**
   * Buscar todos os funcionários
   */
  async getAllEmployees(searchTerm?: string): Promise<Employee[]> {
    try {
      const params: any = {};
      if (searchTerm && searchTerm.trim()) {
        params.searchTerm = searchTerm.trim();
        console.log('🔍 [EmployeeService] Buscando com searchTerm:', params.searchTerm);
      } else {
        console.log('🔍 [EmployeeService] Buscando todos os funcionários (sem searchTerm)');
      }
      const response = await api.get('/api/employees', { params });
      console.log('🔍 [EmployeeService] Resposta recebida:', response.data?.length || 0, 'funcionários');
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      return [];
    }
  },

  /**
   * Buscar funcionários com filtros
   */
  async getEmployees(filters?: {
    registrationNumber?: string;
    positionId?: string;
    positionDescription?: string;
    unitId?: string;
    status?: string;
  }): Promise<Employee[]> {
    try {
      console.log('[EmployeeService] getEmployees chamado com filtros:', filters);
      const params: any = {};
      if (filters?.registrationNumber) params.registrationNumber = filters.registrationNumber;
      if (filters?.positionId) params.positionId = filters.positionId;
      if (filters?.positionDescription) params.positionDescription = filters.positionDescription;
      if (filters?.unitId) params.unitId = filters.unitId;
      if (filters?.status) params.status = filters.status;

      console.log('[EmployeeService] Parâmetros da requisição:', params);
      const response = await api.get('/api/employees', { params });
      console.log('[EmployeeService] Resposta recebida:', response.data?.length || 0, 'funcionários');
      return response.data || [];
    } catch (error) {
      console.error('[EmployeeService] Erro ao buscar funcionários com filtros:', error);
      return [];
    }
  },

  /**
   * Buscar funcionários simplificados para seleção
   */
  async getSimpleEmployees(): Promise<SimpleEmployee[]> {
    try {
      const response = await api.get('/api/employees/basic');
      const data = response.data;
      
      if (data && data.employees) {
        return data.employees.map((emp: any) => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          document: emp.document
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar funcionários simplificados:', error);
      return [];
    }
  },

  /**
   * Buscar funcionário por ID
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    if (!id || id.startsWith('00000000-0000-0000-0000')) {
      return null;
    }
    try {
      const response = await api.get(`/api/employees/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Buscar funcionários por nome
   */
  async searchEmployeesByName(name: string): Promise<Employee[]> {
    try {
      const response = await api.get(`/api/employees/search/name?name=${encodeURIComponent(name)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar funcionários por nome:', error);
      return [];
    }
  },

  /**
   * Buscar funcionários por termo (nome ou documento)
   */
  async searchEmployees(query: string): Promise<Employee[]> {
    try {
      const response = await api.get(`/api/employees/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      return [];
    }
  },

  /**
   * Buscar funcionários por status
   */
  async getEmployeesByStatus(status: string): Promise<Employee[]> {
    try {
      console.log(`[EmployeeService] Buscando funcionários com status: ${status}`);
      const response = await api.get(`/api/employees/status/${status.toUpperCase()}`);
      console.log(`[EmployeeService] Resposta recebida:`, response.data);
      
      if (!response.data) {
        console.warn('[EmployeeService] Resposta vazia do backend');
        return [];
      }
      
      // Garantir que seja um array
      const employees = Array.isArray(response.data) ? response.data : [];
      console.log(`[EmployeeService] ${employees.length} funcionários encontrados`);
      
      return employees;
    } catch (error: any) {
      console.error('[EmployeeService] Erro ao buscar funcionários por status:', error);
      console.error('[EmployeeService] Status do erro:', error.response?.status);
      console.error('[EmployeeService] Mensagem do erro:', error.response?.data);
      return [];
    }
  },

  /**
   * Buscar funcionário por CPF exato (normalizado)
   */
  async searchEmployeeByCpf(cpf: string): Promise<Employee | null> {
    try {
      // Normalizar CPF (remover caracteres não numéricos)
      const normalizedCpf = cpf.replace(/\D/g, '');
      if (!normalizedCpf || normalizedCpf.length < 11) {
        return null;
      }

      // Endpoint disponível no backend: /api/employees/search?q=
      const response = await api.get(`/api/employees/search?q=${encodeURIComponent(normalizedCpf)}`);
      const employees = Array.isArray(response.data) ? response.data : [];
      const exact = employees.find((emp: any) => {
        const empCpf = (emp.document || emp.cpf || '').replace(/\D/g, '');
        return empCpf === normalizedCpf;
      });
      return exact || employees[0] || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Funcionário não encontrado - não é erro
        return null;
      }
      console.error('Erro ao buscar funcionário por CPF:', error);
      return null;
    }
  },

  /**
   * Buscar funcionários simplificados por termo
   */
  async searchSimpleEmployees(query: string): Promise<SimpleEmployee[]> {
    try {
      const response = await api.get(`/api/employees/search/simple?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar funcionários simplificados:', error);
      return [];
    }
  },

  /**
   * Criar novo funcionário
   */
  async createEmployee(employeeData: any): Promise<Employee> {
    try {
      // Converter bankData para bankInfo se existir
      const payload = { ...employeeData } as Record<string, unknown>;
      if (payload.bankData) {
        payload.bankInfo = {
          bank: payload.bankData.bank || '',
          agency: payload.bankData.agency || '',
          account: payload.bankData.account || '',
          accountType: payload.bankData.type || 'CORRENTE'
        };
        delete payload.bankData;
      }

      const cleaned = sanitizeEmployeeWritePayload(payload);
      const response = await api.post('/api/employees', cleaned);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar funcionário:', error);
      throw new Error(error.response?.data?.message || 'Erro ao criar funcionário');
    }
  },

  /**
   * Atualizar funcionário existente
   */
  async updateEmployee(id: string, employeeData: any): Promise<Employee> {
    try {
      // Converter bankData para bankInfo se existir
      const payload = { ...employeeData } as Record<string, unknown>;
      if (payload.bankData) {
        payload.bankInfo = {
          bank: payload.bankData.bank || '',
          agency: payload.bankData.agency || '',
          account: payload.bankData.account || '',
          accountType: payload.bankData.type || 'CORRENTE'
        };
        delete payload.bankData;
      }

      const cleaned = sanitizeEmployeeWritePayload(payload);
      const response = await api.put(`/api/employees/${id}`, cleaned);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar funcionário:', error);
      throw new Error(error.response?.data?.message || 'Erro ao atualizar funcionário');
    }
  },

  /**
   * Atualizar status do funcionário
   */
  async updateEmployeeStatus(id: string, status: string): Promise<Employee> {
    try {
      const response = await api.put(`/api/employees/${id}/status`, null, {
        params: { status }
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar status do funcionário:', error);
      throw new Error(error.response?.data?.message || 'Erro ao atualizar status do funcionário');
    }
  },

  /**
   * Excluir funcionário
   */
  async deleteEmployee(id: string): Promise<void> {
    try {
      await api.delete(`/api/employees/${id}`);
    } catch (error: any) {
      console.error('Erro ao excluir funcionário:', error);
      throw new Error(error.response?.data?.message || 'Erro ao excluir funcionário');
    }
  },

  /**
   * Gerar PDF da ficha de registro do funcionário
   */
  async generateEmployeeRecordPdf(id: string): Promise<Blob> {
    try {
      const response = await api.get(`/api/employees/${id}/generate-record-pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao gerar PDF da ficha de registro:', error);
      throw new Error(error.response?.data?.message || 'Erro ao gerar PDF da ficha de registro');
    }
  },

  /**
   * Gerar Excel da ficha de registro do funcionário
   */
  async generateEmployeeRecordExcel(id: string): Promise<Blob> {
    try {
      const response = await api.get(`/api/employees/${id}/generate-record-excel`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao gerar Excel da ficha de registro:', error);
      throw new Error(error.response?.data?.message || 'Erro ao gerar Excel da ficha de registro');
    }
  },

  /**
   * Importar funcionários de planilha Excel
   */
  async importEmployeesFromExcel(file: File): Promise<{
    success: boolean;
    created: number;
    updated: number;
    errors: string[];
    warnings: string[];
    message: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/employees/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutos
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro ao importar funcionários:', error);
      throw new Error(error.response?.data?.message || 'Erro ao importar funcionários');
    }
  },

  /**
   * Importar funcionários de PDF Ficha de Registro de Empregado (suporta múltiplos funcionários)
   */
  async importEmployeePdf(file: File): Promise<PdfImportResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/employees/import-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000,
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro ao importar PDF da ficha de registro:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Erro ao importar PDF da ficha de registro');
    }
  }
};

export default employeeService;