import api from '@/lib/axios';

export interface WorkScale {
  id: string;
  name: string;
  type: 'WEEKLY' | 'ROTATING_12X36' | 'ROTATING_24X48' | 'CUSTOM';
  workDays?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const workScaleService = {
  /** Lista escalas de trabalho, com busca opcional por nome. */
  async list(search?: string): Promise<WorkScale[]> {
    const query = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const response = await api.get<WorkScale[]>(`/api/work-scales${query}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  /** Cadastra uma nova escala de trabalho. */
  async create(data: { name: string; type?: string; workDays?: string }): Promise<WorkScale> {
    const response = await api.post<WorkScale>('/api/work-scales', data);
    return response.data;
  },
};

export default workScaleService;
