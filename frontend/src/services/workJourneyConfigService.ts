import api from '@/lib/axios';

export interface WorkJourneyConfig {
  id: string;
  companyId: string;
  cargaHorariaDiaria: number;
  toleranciaAtrasoMin: number;
  intervaloMin: number;
  percentualHENormal: number;
  percentualHENoturna: number;
  percentualHE100: number;
  cargaHorariaSemanal: number;
  inicioJornadaNoturna: number;
  fimJornadaNoturna: number;
  bancoHorasAtivo: boolean;
  geoObrigatoria: boolean;
  geoRaioMetros: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyConfigStatus {
  id: string;
  name: string;
  sigla: string;
  cnpj: string;
  hasConfig: boolean;
}

export const workJourneyConfigService = {
  async findAll() {
    const response = await api.get('/work-journey-configs');
    return response.data;
  },

  async findByCompanyId(companyId: string) {
    const response = await api.get(`/work-journey-configs/company/${companyId}`);
    return response.data;
  },

  async saveOrUpdate(companyId: string, updates: Partial<WorkJourneyConfig>) {
    const response = await api.put(`/work-journey-configs/company/${companyId}`, updates);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/work-journey-configs/${id}`);
    return response.data;
  },

  async getCompaniesWithConfigStatus() {
    const response = await api.get('/work-journey-configs/admin/companies-status');
    return response.data;
  }
};

export default workJourneyConfigService;
