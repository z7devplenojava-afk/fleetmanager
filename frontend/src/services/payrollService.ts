import api from '@/lib/axios';

export interface Payroll {
  id: string;
  employee: {
    id: string;
    name: string;
    cpf: string;
    registrationNumber: string;
  };
  unit: {
    id: string;
    name: string;
  };
  referenceMonth: string; // formato: "YYYY-MM"
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  deductions: number;
  bonuses: number;
  overtime: number;
  allowances: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayrollRequest {
  employeeId: string;
  unitId: string;
  referenceMonth: string;
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  deductions: number;
  bonuses: number;
  overtime: number;
  allowances: number;
  notes?: string;
}

export interface UpdatePayrollRequest extends Partial<CreatePayrollRequest> {
  id: string;
}

export interface PayrollFilters {
  employeeId?: string;
  unitId?: string;
  referenceMonth?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface ProcessHoleritesRequest {
  files: File[];
  useOcr?: boolean;
}

export const payrollService = {
  // Buscar todos os holerites com filtros
  async getPayrolls(filters: PayrollFilters = {}): Promise<Payroll[]> {
    const params = new URLSearchParams();
    
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.unitId) params.append('unitId', filters.unitId);
    if (filters.referenceMonth) params.append('referenceMonth', filters.referenceMonth);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    const response = await api.get(`/payrolls?${params.toString()}`);
    return response.data;
  },

  // Buscar holerite por ID
  async getPayrollById(id: string): Promise<Payroll> {
    const response = await api.get(`/payrolls/${id}`);
    return response.data;
  },

  // Buscar holerites por funcionário
  async getPayrollsByEmployee(employeeId: string): Promise<Payroll[]> {
    const response = await api.get(`/payrolls/employee/${employeeId}`);
    return response.data;
  },

  // Buscar holerites por unidade
  async getPayrollsByUnit(unitId: string): Promise<Payroll[]> {
    const response = await api.get(`/payrolls/unit/${unitId}`);
    return response.data;
  },

  // Buscar holerites por mês de referência
  async getPayrollsByMonth(referenceMonth: string): Promise<Payroll[]> {
    const response = await api.get(`/payrolls/month/${referenceMonth}`);
    return response.data;
  },

  // Buscar holerites por ano
  async getPayrollsByYear(year: number): Promise<Payroll[]> {
    const response = await api.get(`/payrolls/year/${year}`);
    return response.data;
  },

  // Buscar holerites por período
  async getPayrollsByDateRange(startDate: string, endDate: string): Promise<Payroll[]> {
    const response = await api.get(`/payrolls/date-range?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Criar novo holerite
  async createPayroll(payrollData: CreatePayrollRequest): Promise<Payroll> {
    const response = await api.post('/payrolls', payrollData);
    return response.data;
  },

  // Atualizar holerite
  async updatePayroll(id: string, payrollData: UpdatePayrollRequest): Promise<Payroll> {
    const response = await api.put(`/payrolls/${id}`, payrollData);
    return response.data;
  },

  // Excluir holerite
  async deletePayroll(id: string): Promise<void> {
    await api.delete(`/payrolls/${id}`);
  },

  // Aprovar holerite
  async approvePayroll(id: string): Promise<Payroll> {
    const response = await api.put(`/payrolls/${id}/approve`);
    return response.data;
  },

  // Marcar como pago
  async markAsPaid(id: string, paymentDate?: string): Promise<Payroll> {
    const data = paymentDate ? { paymentDate } : {};
    const response = await api.put(`/payrolls/${id}/paid`, data);
    return response.data;
  },

  // Cancelar holerite
  async cancelPayroll(id: string): Promise<Payroll> {
    const response = await api.put(`/payrolls/${id}/cancel`);
    return response.data;
  },

  // Processar holerites em PDF
  async processHolerites(request: ProcessHoleritesRequest): Promise<Blob> {
    const formData = new FormData();
    request.files.forEach(file => {
      formData.append('files', file);
    });
    if (request.useOcr) {
      formData.append('useOcr', 'true');
    }

    const response = await api.post('/holerites/process', formData, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Processar holerites com OCR
  async processHoleritesWithOcr(files: File[]): Promise<Blob> {
    return this.processHolerites({ files, useOcr: true });
  },

  // Baixar holerite individual
  async downloadPayroll(id: string): Promise<Blob> {
    const response = await api.get(`/payrolls/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Enviar holerite por email
  async sendPayrollByEmail(id: string, email: string): Promise<void> {
    await api.post(`/payrolls/${id}/send-email`, { email });
  },

  // Buscar holerites pendentes
  async getPendingPayrolls(): Promise<Payroll[]> {
    return this.getPayrolls({ status: 'PENDING' });
  },

  // Buscar holerites aprovados
  async getApprovedPayrolls(): Promise<Payroll[]> {
    return this.getPayrolls({ status: 'APPROVED' });
  },

  // Buscar holerites pagos
  async getPaidPayrolls(): Promise<Payroll[]> {
    return this.getPayrolls({ status: 'PAID' });
  },

  // Buscar holerites cancelados
  async getCancelledPayrolls(): Promise<Payroll[]> {
    return this.getPayrolls({ status: 'CANCELLED' });
  },

  // Calcular total de salários por mês
  async getTotalSalariesByMonth(referenceMonth: string): Promise<number> {
    const response = await api.get(`/payrolls/total-salary/${referenceMonth}`);
    return response.data;
  },

  // Gerar relatório de holerites
  async generatePayrollReport(filters: PayrollFilters = {}): Promise<any> {
    const params = new URLSearchParams();
    
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.unitId) params.append('unitId', filters.unitId);
    if (filters.referenceMonth) params.append('referenceMonth', filters.referenceMonth);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/payrolls/report?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Verificar status do processamento
  async getProcessingStatus(): Promise<any> {
    const response = await api.get('/holerites/status');
    return response.data;
  }
}; 