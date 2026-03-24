import api from '@/lib/axios';
import type { VehicleGateChecklist, CreateVehicleGateChecklistDTO, ChecklistType } from '@/types/portaria';

class VehicleGateChecklistService {
  async findAll(params?: {
    vehicleId?: string;
    type?: ChecklistType;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<VehicleGateChecklist[]> {
    const searchParams = new URLSearchParams();
    if (params?.vehicleId) searchParams.set('vehicleId', params.vehicleId);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
    const query = searchParams.toString();
    const url = query ? `/frota/vehicle-gate-checklists?${query}` : '/frota/vehicle-gate-checklists';
    const response = await api.get(url);
    return response.data;
  }

  async findById(id: string): Promise<VehicleGateChecklist> {
    const response = await api.get(`/frota/vehicle-gate-checklists/${id}`);
    return response.data;
  }

  async create(dto: CreateVehicleGateChecklistDTO): Promise<VehicleGateChecklist> {
    const payload = {
      ...dto,
      occurredAt: dto.occurredAt || new Date().toISOString(),
    };
    const response = await api.post('/frota/vehicle-gate-checklists', payload);
    return response.data;
  }

  async update(id: string, dto: Partial<CreateVehicleGateChecklistDTO>): Promise<VehicleGateChecklist> {
    const response = await api.put(`/frota/vehicle-gate-checklists/${id}`, dto);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/frota/vehicle-gate-checklists/${id}`);
  }

  async uploadOdometerPhoto(id: string, file: File, description?: string): Promise<VehicleGateChecklist> {
    const formData = new FormData();
    formData.append('photo', file);
    if (description) formData.append('description', description);
    const response = await api.post(`/frota/vehicle-gate-checklists/${id}/odometer-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async uploadVehiclePhotos(id: string, files: File[]): Promise<VehicleGateChecklist> {
    if (!files.length) return this.findById(id);
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    const response = await api.post(`/frota/vehicle-gate-checklists/${id}/vehicle-photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

export default new VehicleGateChecklistService();
