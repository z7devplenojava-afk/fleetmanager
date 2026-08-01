import api from '@/lib/axios';

export interface ClientDocumentation {
  id: string;
  clientId: string;
  clientName: string;
  companyId: string;
  year: number;
  month: number;
  createdAt: string;
  updatedAt: string;
  stageCount: number;
}

export interface ClientDocStage {
  id: string;
  documentationId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface ClientDocCategory {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  companyId?: string;
  createdAt: string;
}

export interface ClientDocFile {
  id: string;
  stageId: string;
  categoryId: string;
  categoryName: string;
  originalName: string;
  storedPath: string;
  fileSize: number;
  displaySize: string;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface CreateDocumentationRequest {
  clientId: string;
  year: number;
  month: number;
}

export interface CreateStageRequest {
  documentationId: string;
  name: string;
  sortOrder?: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || `Mês ${month}`;
}

class ClientDocumentationService {
  // Documentation
  async listByClient(clientId: string): Promise<ClientDocumentation[]> {
    const response = await api.get(`/client-documentation/client/${clientId}`);
    return response.data;
  }

  async getDocumentation(id: string): Promise<ClientDocumentation> {
    const response = await api.get(`/client-documentation/${id}`);
    return response.data;
  }

  async createDocumentation(data: CreateDocumentationRequest): Promise<ClientDocumentation> {
    const response = await api.post('/client-documentation', data);
    return response.data;
  }

  async deleteDocumentation(id: string): Promise<void> {
    await api.delete(`/client-documentation/${id}`);
  }

  // Stages
  async listStages(documentationId: string): Promise<ClientDocStage[]> {
    const response = await api.get(`/client-documentation/${documentationId}/stages`);
    return response.data;
  }

  async createStage(data: CreateStageRequest): Promise<ClientDocStage> {
    const response = await api.post('/client-documentation/stages', data);
    return response.data;
  }

  async renameStage(stageId: string, name: string): Promise<ClientDocStage> {
    const response = await api.put(`/client-documentation/stages/${stageId}`, { name });
    return response.data;
  }

  async deleteStage(stageId: string): Promise<void> {
    await api.delete(`/client-documentation/stages/${stageId}`);
  }

  // Categories
  async listCategories(): Promise<ClientDocCategory[]> {
    const response = await api.get('/client-documentation/categories');
    return response.data;
  }

  async createCategory(data: CreateCategoryRequest): Promise<ClientDocCategory> {
    const response = await api.post('/client-documentation/categories', data);
    return response.data;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await api.delete(`/client-documentation/categories/${categoryId}`);
  }

  // Files
  async listFiles(stageId: string, categoryId: string): Promise<ClientDocFile[]> {
    const response = await api.get(`/client-documentation/stages/${stageId}/categories/${categoryId}/files`);
    return response.data;
  }

  async uploadFile(stageId: string, categoryId: string, file: File): Promise<ClientDocFile> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(
      `/client-documentation/stages/${stageId}/categories/${categoryId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await api.get(`/client-documentation/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/client-documentation/files/${fileId}`);
  }

  // Full structure
  async getFullStructure(documentationId: string): Promise<any> {
    const response = await api.get(`/client-documentation/${documentationId}/structure`);
    return response.data;
  }
}

export const clientDocumentationService = new ClientDocumentationService();
