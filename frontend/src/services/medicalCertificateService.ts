import api from '@/lib/axios';

export type MedicalCertificateType =
  | 'ATESTADO_AFASTAMENTO'
  | 'DECLARACAO_COMPARECIMENTO'
  | 'ATESTADO_ACOMPANHAMENTO'
  | 'ATESTADO_APTIDAO'
  | 'ATESTADO_DOENCA_ACIDENTE'
  | 'AFASTAMENTO_INSS'
  | 'ACIDENTE_TRABALHO'
  | 'LICENCA_MATERNIDADE_PATERNIDADE'
  | 'LICENCA_MATRIMONIAL'
  | 'TESTEMUNHA_JUDICIAL'
  | 'PROCESSO_TRABALHISTA';

export const MEDICAL_CERTIFICATE_TYPE_LABELS: Record<MedicalCertificateType, string> = {
  ATESTADO_AFASTAMENTO: 'Atestado de Afastamento / Doença',
  DECLARACAO_COMPARECIMENTO: 'Declaração de Comparecimento',
  ATESTADO_ACOMPANHAMENTO: 'Atestado de Acompanhamento',
  ATESTADO_APTIDAO: 'Atestado de Aptidão Física ou Sanidade',
  ATESTADO_DOENCA_ACIDENTE: 'Atestado por Doença ou Acidente',
  AFASTAMENTO_INSS: 'Afastamento pelo INSS',
  ACIDENTE_TRABALHO: 'Acidente de Trabalho',
  LICENCA_MATERNIDADE_PATERNIDADE: 'Licença Maternidade ou Paternidade',
  LICENCA_MATRIMONIAL: 'Licença Matrimonial',
  TESTEMUNHA_JUDICIAL: 'Afastamento como Testemunha Judicial',
  PROCESSO_TRABALHISTA: 'Processos Trabalhistas',
};

export const MEDICAL_CERTIFICATE_TYPE_COLORS: Record<MedicalCertificateType, { bg: string; text: string; border: string }> = {
  ATESTADO_AFASTAMENTO: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  DECLARACAO_COMPARECIMENTO: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  ATESTADO_ACOMPANHAMENTO: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  ATESTADO_APTIDAO: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  ATESTADO_DOENCA_ACIDENTE: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  AFASTAMENTO_INSS: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  ACIDENTE_TRABALHO: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  LICENCA_MATERNIDADE_PATERNIDADE: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  LICENCA_MATRIMONIAL: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  TESTEMUNHA_JUDICIAL: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  PROCESSO_TRABALHISTA: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' },
};

export type MedicalCertificateStatus = 'APROVADO' | 'PENDENTE' | 'REJEITADO' | 'CANCELADO';

export interface MedicalCertificate {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCpf?: string;
  employeeRegistration?: string;
  employeePosition?: string;
  employeeWorkPost?: string;
  companyId?: string;
  companyName?: string;

  type: MedicalCertificateType;
  typeDescription: string;

  startDate: string;
  endDate: string;
  daysCount: number;
  absenceHours: number;
  isPartialDay: boolean;

  cidCode?: string;
  cidDescription?: string;

  doctorName?: string;
  doctorCrm?: string;
  doctorSpecialty?: string;

  documentUrl?: string;
  documentName?: string;
  documentType?: string;

  notes?: string;
  status: MedicalCertificateStatus;
  statusDescription: string;

  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalCertificateDTO {
  employeeId: string;
  companyId?: string;
  type: MedicalCertificateType;
  startDate: string;
  endDate: string;
  daysCount?: number;
  absenceHours?: number;
  isPartialDay?: boolean;
  cidCode?: string;
  cidDescription?: string;
  doctorName?: string;
  doctorCrm?: string;
  doctorSpecialty?: string;
  documentUrl?: string;
  documentName?: string;
  documentType?: string;
  notes?: string;
  status?: MedicalCertificateStatus;
}

export type UpdateMedicalCertificateDTO = Partial<CreateMedicalCertificateDTO>;

export interface MedicalCertificateStats {
  totalCertificates: number;
  activeToday: number;
  daysThisMonth: number;
  hoursThisMonth: number;
  pendingApproval: number;
}

export interface Cid10DTO {
  code: string;
  description: string;
  category?: string;
}

export const medicalCertificateService = {
  async getAll(): Promise<MedicalCertificate[]> {
    const response = await api.get('/api/medical-certificates');
    return response.data || [];
  },

  async getStats(): Promise<MedicalCertificateStats> {
    const response = await api.get('/api/medical-certificates/stats');
    return response.data;
  },

  async getById(id: string): Promise<MedicalCertificate> {
    const response = await api.get(`/api/medical-certificates/${id}`);
    return response.data;
  },

  async getByEmployee(employeeId: string): Promise<MedicalCertificate[]> {
    const response = await api.get(`/api/medical-certificates/employee/${employeeId}`);
    return response.data || [];
  },

  async create(data: CreateMedicalCertificateDTO): Promise<MedicalCertificate> {
    const response = await api.post('/api/medical-certificates', data);
    return response.data;
  },

  async update(id: string, data: UpdateMedicalCertificateDTO): Promise<MedicalCertificate> {
    const response = await api.put(`/api/medical-certificates/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/medical-certificates/${id}`);
  },

  async uploadAttachment(file: File): Promise<{ url: string; fileName: string; fileType: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/medical-certificates/upload', formData);
    return response.data;
  },

  async searchCid10(query: string, limit: number = 20): Promise<Cid10DTO[]> {
    const response = await api.get('/api/cid10/search', {
      params: { query, limit },
    });
    return response.data || [];
  },

  async getCid10ByCode(code: string): Promise<Cid10DTO | null> {
    try {
      const response = await api.get(`/api/cid10/${code}`);
      return response.data;
    } catch {
      return null;
    }
  },
};

export default medicalCertificateService;
