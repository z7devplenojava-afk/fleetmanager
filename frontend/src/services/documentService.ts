import api from '@/lib/axios';

export enum DocumentType {
  CPF = 'CPF',
  RG = 'RG',
  CNH = 'CNH',
  TITULO_ELEITOR = 'TITULO_ELEITOR',
  CERTIDAO_NASCIMENTO = 'CERTIDAO_NASCIMENTO',
  CERTIDAO_CASAMENTO = 'CERTIDAO_CASAMENTO',
  COMPROVANTE_RESIDENCIA = 'COMPROVANTE_RESIDENCIA',
  CONTRATO_TRABALHO = 'CONTRATO_TRABALHO',
  CARTEIRA_TRABALHO = 'CARTEIRA_TRABALHO',
  CERTIFICADO_MILITAR = 'CERTIFICADO_MILITAR',
  OUTROS = 'OUTROS'
}

export interface Document {
  id: string;
  type: DocumentType;
  number: string;
  issueDate: string;
  expirationDate?: string;
  fileUrl?: string;
  fileName?: string;
  description?: string;
  employee?: {
    id: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDocumentRequest {
  type: DocumentType;
  number: string;
  issueDate: Date;
  expirationDate?: Date;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  employee: {
    id: string;
  };
}

class DocumentService {
  async getDocumentsByEmployee(employeeId: string): Promise<Document[]> {
    const response = await api.get(`/documents/employee/${employeeId}`);
    return response.data;
  }

  async getDocumentTypes(): Promise<DocumentType[]> {
    const response = await api.get('/documents/types');
    return response.data;
  }

  async createDocument(document: CreateDocumentRequest): Promise<Document> {
    const response = await api.post('/documents', document);
    return response.data;
  }

  async updateDocument(id: string, document: Partial<Document>): Promise<Document> {
    const response = await api.put(`/documents/${id}`, document);
    return response.data;
  }

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  }

  async uploadFile(documentId: string, file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/documents/${documentId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async downloadFile(documentId: string): Promise<Blob> {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async viewFile(documentId: string): Promise<Blob> {
    const response = await api.get(`/documents/${documentId}/view`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getDocument(id: string): Promise<Document> {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  }

  async getAllDocuments(): Promise<Document[]> {
    const response = await api.get('/documents');
    return response.data;
  }

  async getDocumentsByType(type: DocumentType): Promise<Document[]> {
    const response = await api.get(`/documents/type/${type}`);
    return response.data;
  }

  async getExpiringDocuments(): Promise<Document[]> {
    const response = await api.get('/documents/expiring');
    return response.data;
  }

  async getDocuments(): Promise<Document[]> {
    const response = await api.get('/documents');
    return response.data;
  }

  async generatePDF(payload: any): Promise<Blob> {
    const response = await api.post('/documents/generate-pdf', payload, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const documentService = new DocumentService();