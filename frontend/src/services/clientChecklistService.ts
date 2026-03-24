import api from '@/lib/axios';
import type {
  ClientChecklistTemplate,
  ClientChecklistRecord,
  CreateClientChecklistTemplateDTO,
  CreateClientChecklistRecordDTO,
} from '@/types/clientChecklist';

class ClientChecklistService {
  // Templates
  async getTemplates(clientId: string): Promise<ClientChecklistTemplate[]> {
    const response = await api.get('/client-checklists/templates', {
      params: { clientId },
    });
    return response.data;
  }

  async getTemplateById(id: string): Promise<ClientChecklistTemplate> {
    const response = await api.get(`/client-checklists/templates/${id}`);
    return response.data;
  }

  async createTemplate(dto: CreateClientChecklistTemplateDTO): Promise<ClientChecklistTemplate> {
    const response = await api.post('/client-checklists/templates', dto);
    return response.data;
  }

  async updateTemplate(
    id: string,
    dto: Partial<CreateClientChecklistTemplateDTO> & { items?: { title: string; orderIndex?: number; required?: boolean }[] }
  ): Promise<ClientChecklistTemplate> {
    const response = await api.put(`/client-checklists/templates/${id}`, dto);
    return response.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/client-checklists/templates/${id}`);
  }

  // Records
  async getRecords(params?: {
    clientId?: string;
    templateId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ClientChecklistRecord[]> {
    const response = await api.get('/client-checklists/records', { params });
    return response.data;
  }

  async getRecordById(id: string): Promise<ClientChecklistRecord> {
    const response = await api.get(`/client-checklists/records/${id}`);
    return response.data;
  }

  async createRecord(dto: CreateClientChecklistRecordDTO): Promise<ClientChecklistRecord> {
    const response = await api.post('/client-checklists/records', dto);
    return response.data;
  }

  async updateRecord(id: string, dto: Partial<CreateClientChecklistRecordDTO>): Promise<ClientChecklistRecord> {
    const response = await api.put(`/client-checklists/records/${id}`, dto);
    return response.data;
  }

  async deleteRecord(id: string): Promise<void> {
    await api.delete(`/client-checklists/records/${id}`);
  }

  async uploadOdometerPhoto(
    id: string,
    file: File,
    description?: string
  ): Promise<ClientChecklistRecord> {
    const formData = new FormData();
    formData.append('photo', file);
    if (description) formData.append('description', description);
    const response = await api.post(`/client-checklists/records/${id}/odometer-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async uploadVehiclePhotos(id: string, files: File[]): Promise<ClientChecklistRecord> {
    if (!files.length) return this.getRecordById(id);
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    const response = await api.post(`/client-checklists/records/${id}/vehicle-photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

export default new ClientChecklistService();
