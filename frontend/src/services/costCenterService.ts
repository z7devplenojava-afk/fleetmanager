import api from '@/lib/axios';

export interface CostCenterDTO {
  id?: string;
  code?: string;
  name: string;
  description?: string;
  responsible?: string;
  department?: string;
  budget?: number;
  currentSpent?: number;
  status?: 'ATIVO' | 'INATIVO' | 'SUSPENSO' | 'ACTIVE' | 'INACTIVE';
}

export const costCenterService = {
  async list(params: { name?: string; status?: 'ACTIVE' | 'INACTIVE'; page?: number; size?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.name) qs.append('name', params.name);
    if (params.status) qs.append('status', params.status);
    if (params.page !== undefined) qs.append('page', String(params.page));
    if (params.size !== undefined) qs.append('size', String(params.size));
    const { data } = await api.get(`/api/cost-centers?${qs.toString()}`);
    return data;
  },
  
  async listActive() {
    const { data } = await api.get('/api/cost-centers/active');
    return data;
  },
  
  async create(dto: CostCenterDTO) {
    const { data } = await api.post('/api/cost-centers', dto);
    return data;
  },
  async update(id: string, dto: CostCenterDTO) {
    const { data } = await api.put(`/api/cost-centers/${id}`, dto);
    return data;
  },
  async remove(id: string) {
    await api.delete(`/api/cost-centers/${id}`);
  },
  async toggleStatus(id: string) {
    const { data } = await api.patch(`/api/cost-centers/${id}/toggle-status`);
    return data as CostCenterDTO;
  },
};


