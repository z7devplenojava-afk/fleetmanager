import api from '@/lib/axios';

export interface TimeRecordRequest {
  employeeId: string;
  recordType: 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA';
  qrCode?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface TimeRecord {
  id: string;
  employee: any;
  workPost?: any;
  recordType: 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA';
  recordedAt: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  userAgent?: string;
  qrCodeUsed?: string;
  isManual: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export const timeRecordService = {
  async registerTimeRecord(data: TimeRecordRequest) {
    const response = await api.post('/time-records/register', data);
    return response.data;
  },

  async getTodayRecords(employeeId: string) {
    if (!employeeId || employeeId.startsWith('00000000-0000-0000-0000')) {
      return [];
    }
    try {
      const response = await api.get(`/time-records/today/${employeeId}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      return [];
    }
  },

  async getEmployeeRecords(employeeId: string, page = 0, size = 20) {
    if (!employeeId || employeeId.startsWith('00000000-0000-0000-0000')) {
      return [];
    }
    try {
      const response = await api.get(`/time-records/employee/${employeeId}`, {
        params: { page, size }
      });
      return response.data?.data || response.data || [];
    } catch (error) {
      return [];
    }
  },

  async getRecordsByPeriod(employeeId: string, startDate: string, endDate: string) {
    const response = await api.get(`/time-records/period/${employeeId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  async getNextRecordType(employeeId: string) {
    const response = await api.get(`/time-records/next-record-type/${employeeId}`);
    return response.data;
  },

  async approveRecord(recordId: string, approverId: string) {
    const response = await api.put(`/time-records/${recordId}/approve`, { approverId });
    return response.data;
  },

  async rejectRecord(recordId: string, approverId: string, reason: string) {
    const response = await api.put(`/time-records/${recordId}/reject`, { approverId, reason });
    return response.data;
  },

  // ===== Justification =====
  async submitJustification(recordId: string, employeeId: string, justification: string) {
    const response = await api.post(`/time-records/${recordId}/justify`, {
      employeeId,
      justification
    });
    return response.data;
  },

  // ===== Admin / Management =====
  async getAdminDashboard() {
    const response = await api.get('/time-records/admin/dashboard');
    return response.data;
  },

  async getAdminRecords(params: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    department?: string;
  }) {
    const cleanParams: Record<string, string> = {};
    if (params.employeeId) cleanParams.employeeId = params.employeeId;
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;
    if (params.status) cleanParams.status = params.status;
    if (params.department) cleanParams.department = params.department;
    const response = await api.get('/time-records/admin/records', { params: cleanParams });
    return response.data;
  },

  async batchApproveRecords(recordIds: string[], approverId: string) {
    const response = await api.post('/time-records/admin/batch-approve', {
      recordIds,
      approverId
    });
    return response.data;
  },

  async batchRejectRecords(recordIds: string[], approverId: string, reason: string) {
    const response = await api.post('/time-records/admin/batch-reject', {
      recordIds,
      approverId,
      reason
    });
    return response.data;
  },

  async getIndicators(startDate: string, endDate: string, department?: string) {
    const params: Record<string, string> = { startDate, endDate };
    if (department) params.department = department;
    const response = await api.get('/time-records/admin/indicators', { params });
    return response.data;
  },

  async getConsolidated(startDate: string, endDate: string) {
    const response = await api.get('/time-records/admin/consolidated', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  async getConsolidatedReportPdf(startDate: string, endDate: string) {
    const response = await api.get('/time-records/admin/consolidated/report/pdf', {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  },

  async getConsolidatedReportExcel(startDate: string, endDate: string) {
    const response = await api.get('/time-records/admin/consolidated/report/excel', {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  }
};

export default timeRecordService;

