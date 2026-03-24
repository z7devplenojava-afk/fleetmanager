import api from '@/lib/axios';

export interface PayrollClosure {
  id: string;
  employeeId: string;
  employeeName?: string;
  referenceMonth: number;
  referenceYear: number;
  startDate: string;
  endDate: string;
  totalHoursWorked: number;
  regularHours: number;
  overtime50: number;
  overtime100: number;
  nightShiftHours: number;
  totalDelaysMinutes: number;
  totalAbsencesDays: number;
  workedDays: number;
  expectedDays: number;
  status: 'DRAFT' | 'CLOSED';
  payPeriodId?: string;
  payPeriod?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    type: string;
  };
  closedAt?: string;
  closedById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'MONTHLY' | 'CUSTOM' | 'BIWEEKLY' | 'WEEKLY';
  referenceMonth?: number;
  referenceYear?: number;
  isClosed: boolean;
  closedAt?: string;
  closedById?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollItem {
  id: string;
  payrollId?: string;
  payrollClosureId?: string;
  employeeId: string;
  description: string;
  amount: number;
  type: string;
  hours?: number;
  unitValue?: number;
  category?: 'EARNINGS' | 'DEDUCTIONS' | 'BENEFITS';
  createdAt: string;
  updatedAt: string;
}

export interface PontoImportJob {
  id: string;
  importHash: string;
  fileName?: string;
  fileSize?: number;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  errorMessage?: string;
  importedById?: string;
  importedAt: string;
  completedAt?: string;
}

export interface BankHours {
  id: string;
  employeeId: string;
  contractId?: string;
  balanceHours: number;
  expirationDate?: string;
  lastUpdatedAt: string;
}

export interface BankHoursTransaction {
  id: string;
  bankHoursId: string;
  transactionType: 'CREDIT' | 'DEBIT';
  hours: number;
  sourceType: string;
  description?: string;
  transactionDate: string;
  createdAt: string;
}

class PayrollClosureService {
  // PayrollClosure
  async getClosures(params?: { employeeId?: string; month?: number; year?: number }) {
    const response = await api.get('/payroll-closures', { params });
    return response.data;
  }

  async getClosureById(id: string) {
    const response = await api.get(`/payroll-closures/${id}`);
    return response.data;
  }

  async getClosuresByEmployee(employeeId: string) {
    const response = await api.get(`/payroll-closures/employee/${employeeId}`);
    return response.data;
  }

  async generateClosure(employeeId: string, month: number, year: number) {
    const response = await api.post('/payroll-closures/generate', {
      employeeId,
      month,
      year,
    });
    return response.data;
  }

  async generateClosureForPeriod(employeeId: string, payPeriodId: string) {
    const response = await api.post('/payroll-closures/generate-for-period', {
      employeeId,
      payPeriodId,
    });
    return response.data;
  }

  async closeClosure(id: string) {
    const response = await api.post(`/payroll-closures/${id}/close`, {});
    return response.data;
  }

  async generateBatchClosures(month: number, year: number) {
    const response = await api.post('/payroll-closures/generate-batch', {
      month,
      year,
    });
    return response.data;
  }

  // PayPeriod
  async getPayPeriods(params?: { year?: number; type?: string }) {
    const response = await api.get('/pay-periods', { params });
    return response.data;
  }

  async getPayPeriodById(id: string) {
    const response = await api.get(`/pay-periods/${id}`);
    return response.data;
  }

  async getMonthlyPeriod(year: number, month: number) {
    const response = await api.get(`/pay-periods/monthly/${year}/${month}`);
    return response.data;
  }

  async createCustomPeriod(data: {
    name: string;
    startDate: string;
    endDate: string;
    description?: string;
  }) {
    const params = new URLSearchParams();
    params.append('name', data.name);
    params.append('startDate', data.startDate);
    params.append('endDate', data.endDate);
    if (data.description) {
      params.append('description', data.description);
    }
    const response = await api.post(`/pay-periods/custom?${params.toString()}`);
    return response.data;
  }

  async createBiweeklyPeriod(year: number, month: number, quinzena: number) {
    const response = await api.post(`/pay-periods/biweekly/${year}/${month}/${quinzena}`);
    return response.data;
  }

  async closePeriod(id: string, closedById?: string) {
    const params: any = {};
    if (closedById) {
      params.closedById = closedById;
    }
    const response = await api.post(`/pay-periods/${id}/close`, null, { params });
    return response.data;
  }

  // PayrollItems
  async getItemsByClosure(payrollClosureId: string) {
    const response = await api.get(`/payroll-items/closure/${payrollClosureId}`);
    return response.data;
  }

  async getItemsByEmployee(employeeId: string) {
    const response = await api.get(`/payroll-items/employee/${employeeId}`);
    return response.data;
  }

  async getClosureSummary(payrollClosureId: string) {
    const response = await api.get(`/payroll-items/closure/${payrollClosureId}/summary`);
    return response.data;
  }

  async regenerateItems(payrollClosureId: string, hourlyRate?: number) {
    const response = await api.post(`/payroll-items/closure/${payrollClosureId}/regenerate`, {
      hourlyRate,
    });
    return response.data;
  }

  // Ponto Import
  async importFromFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/ponto-import/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async importFromList(batidas: any[]) {
    const response = await api.post('/ponto-import/list', { batidas });
    return response.data;
  }

  async getImportJobs() {
    const response = await api.get('/ponto-import/jobs');
    return response.data;
  }

  async getImportJobById(id: string) {
    const response = await api.get(`/ponto-import/jobs/${id}`);
    return response.data;
  }

  async getUnprocessedRecords() {
    const response = await api.get('/ponto-import/unprocessed');
    return response.data;
  }

  // Ponto Processing
  async processBatidas(employeeId: string, startDate?: string, endDate?: string) {
    const response = await api.post(`/ponto-processing/process/${employeeId}`, {
      startDate,
      endDate,
    });
    return response.data;
  }

  // Bank Hours
  async getBankHours(employeeId: string, contractId?: string) {
    const response = await api.get(`/bank-hours/employee/${employeeId}`, {
      params: { contractId },
    });
    return response.data;
  }

  async creditHours(data: {
    employeeId: string;
    contractId?: string;
    hours: number;
    description?: string;
    sourcePayrollClosureId?: string;
  }) {
    const response = await api.post('/bank-hours/credit', data);
    return response.data;
  }

  async debitHours(data: {
    employeeId: string;
    contractId?: string;
    hours: number;
    sourceType?: string;
    description?: string;
  }) {
    const response = await api.post('/bank-hours/debit', data);
    return response.data;
  }

  async adjustBalance(data: {
    employeeId: string;
    contractId?: string;
    hours: number;
    type: 'CREDIT' | 'DEBIT';
    description?: string;
  }) {
    const response = await api.post('/bank-hours/adjust', data);
    return response.data;
  }

  async getTransactionHistory(employeeId: string) {
    const response = await api.get(`/bank-hours/employee/${employeeId}/transactions`);
    return response.data;
  }

  async getExpiringBalances(daysAhead: number = 30) {
    const response = await api.get('/bank-hours/expiring', {
      params: { daysAhead },
    });
    return response.data;
  }
}

export const payrollClosureService = new PayrollClosureService();
