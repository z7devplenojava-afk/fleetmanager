import api from '@/lib/axios';

class TimeSheetService {
  async downloadTimeSheet(employeeId: string, year?: number, month?: number) {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    const response = await api.get(`/api/time-sheets/${employeeId}`, {
      params,
      responseType: 'blob',
    });

    return response.data as Blob;
  }
}

export const timeSheetService = new TimeSheetService();



