import api from '@/lib/axios';

export type VehicleDocumentType = 'CRLV' | 'DUT' | 'SEGURO' | 'IPVA' | 'OUTRO';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  docType: VehicleDocumentType;
  title?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  originalName: string;
  fileSize?: number;
  displaySize?: string;
  mimeType?: string;
  uploadedBy?: string;
  companyId?: string;
  createdAt: string;
}

class VehicleDocumentService {
  async list(vehicleId?: string): Promise<VehicleDocument[]> {
    const query = vehicleId ? `?vehicleId=${vehicleId}` : '';
    const response = await api.get(`/api/frota/vehicle-documents${query}`);
    return response.data;
  }

  async getById(id: string): Promise<VehicleDocument> {
    const response = await api.get(`/api/frota/vehicle-documents/${id}`);
    return response.data;
  }

  async upload(data: {
    vehicleId: string;
    docType: VehicleDocumentType;
    title?: string;
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    file: File;
  }): Promise<VehicleDocument> {
    const formData = new FormData();
    formData.append('vehicleId', data.vehicleId);
    formData.append('docType', data.docType);
    if (data.title) formData.append('title', data.title);
    if (data.documentNumber) formData.append('documentNumber', data.documentNumber);
    if (data.issueDate) formData.append('issueDate', data.issueDate);
    if (data.expiryDate) formData.append('expiryDate', data.expiryDate);
    formData.append('file', data.file);
    const response = await api.post('/api/frota/vehicle-documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async download(id: string): Promise<Blob> {
    const response = await api.get(`/api/frota/vehicle-documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/api/frota/vehicle-documents/${id}`);
  }
}

export const vehicleDocumentService = new VehicleDocumentService();
