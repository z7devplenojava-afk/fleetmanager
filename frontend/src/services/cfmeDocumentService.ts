import api from '@/lib/axios';

/** Categorias do Controle de Certificações Federais, Municipais e Estaduais. */
export type CfmeCategory =
  | 'ANTT'
  | 'ATR'
  | 'DEER'
  | 'CREA'
  | 'CERTIDAO'
  | 'LISTA_PASSAGEIROS'
  | 'AUTORIZACAO_VIAGEM'
  | 'ATA'
  | 'OUTRO';

export type CfmeStatus = 'VIGENTE' | 'VENCENDO' | 'VENCIDO' | 'SEM_VALIDADE';

export interface CfmeDocument {
  id: string;
  category: CfmeCategory;
  categoryDescription?: string;
  title?: string;
  issuer?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  originalName: string;
  fileSize?: number;
  displaySize?: string;
  mimeType?: string;
  notes?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  companyId?: string;
  createdAt: string;
  updatedAt?: string;
  status: CfmeStatus;
  daysToExpiry?: number | null;
}

export interface CfmeDocumentFormData {
  category: CfmeCategory;
  title?: string;
  issuer?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
}

/** Rótulos curtos usados na navegação por abas. */
export const CFME_CATEGORY_LABELS: Record<CfmeCategory, string> = {
  ANTT: 'ANTT',
  ATR: 'ATR',
  DEER: 'DEER',
  CREA: 'CREA',
  CERTIDAO: 'Certidões',
  LISTA_PASSAGEIROS: 'Lista de Passageiros',
  AUTORIZACAO_VIAGEM: 'Autorização de Viagens',
  ATA: 'Atas',
  OUTRO: 'Outros',
};

/** Descrições completas das categorias (rótulo dos selects). */
export const CFME_CATEGORY_DESCRIPTIONS: Record<CfmeCategory, string> = {
  ANTT: 'ANTT (Agência Nacional de Transportes Terrestres)',
  ATR: 'ATR (Autorização de Transporte Rodoviário)',
  DEER: 'DEER (Departamento de Estradas de Rodagem)',
  CREA: 'CREA (Conselho Regional de Engenharia e Agronomia)',
  CERTIDAO: 'Certidões em geral',
  LISTA_PASSAGEIROS: 'Lista de Passageiros',
  AUTORIZACAO_VIAGEM: 'Autorização de Viagens',
  ATA: 'Atas',
  OUTRO: 'Outros documentos',
};

export const CFME_CATEGORIES: CfmeCategory[] = [
  'ANTT',
  'ATR',
  'DEER',
  'CREA',
  'CERTIDAO',
  'LISTA_PASSAGEIROS',
  'AUTORIZACAO_VIAGEM',
  'ATA',
  'OUTRO',
];

/** Extensões aceitas no upload (PDF, Excel, CSV e Word). */
export const CFME_ACCEPTED_EXTENSIONS =
  '.pdf,.xls,.xlsx,.csv,.doc,.docx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

class CfmeDocumentService {
  async list(category?: CfmeCategory): Promise<CfmeDocument[]> {
    const query = category ? `?category=${category}` : '';
    const response = await api.get(`/api/cfme-documents${query}`);
    return Array.isArray(response.data) ? response.data : [];
  }

  async getById(id: string): Promise<CfmeDocument> {
    const response = await api.get(`/api/cfme-documents/${id}`);
    return response.data;
  }

  async upload(data: CfmeDocumentFormData & { file: File }): Promise<CfmeDocument> {
    const formData = new FormData();
    formData.append('category', data.category);
    if (data.title) formData.append('title', data.title);
    if (data.issuer) formData.append('issuer', data.issuer);
    if (data.documentNumber) formData.append('documentNumber', data.documentNumber);
    if (data.issueDate) formData.append('issueDate', data.issueDate);
    if (data.expiryDate) formData.append('expiryDate', data.expiryDate);
    if (data.notes) formData.append('notes', data.notes);
    formData.append('file', data.file);

    const response = await api.post('/api/cfme-documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async update(id: string, data: CfmeDocumentFormData): Promise<CfmeDocument> {
    const response = await api.put(`/api/cfme-documents/${id}`, data);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/api/cfme-documents/${id}`);
  }

  /** Baixa o arquivo como Blob (necessário pois o endpoint exige o header Authorization). */
  async fetchFile(id: string): Promise<Blob> {
    const response = await api.get(`/api/cfme-documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const cfmeDocumentService = new CfmeDocumentService();
export default cfmeDocumentService;
