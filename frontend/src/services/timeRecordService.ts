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
    const response = await api.get(`/time-records/today/${employeeId}`);
    return response.data;
  },

  async getEmployeeRecords(employeeId: string, page = 0, size = 20) {
    const response = await api.get(`/time-records/employee/${employeeId}`, {
      params: { page, size }
    });
    return response.data;
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
  }
};

export default timeRecordService;

