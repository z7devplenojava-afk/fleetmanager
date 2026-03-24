import api from '@/lib/axios';
import type { TransportMobilization, CreateTransportMobilizationDTO, MobilizationType } from '@/types/mobilization';

class TransportMobilizationService {
    async findAll(params?: {
        companyId?: string;
        vehicleId?: string;
        type?: MobilizationType;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<TransportMobilization[]> {
        const searchParams = new URLSearchParams();
        if (params?.companyId) searchParams.set('companyId', params.companyId);
        if (params?.vehicleId) searchParams.set('vehicleId', params.vehicleId);
        if (params?.type) searchParams.set('type', params.type);
        if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
        if (params?.dateTo) searchParams.set('dateTo', params.dateTo);

        const query = searchParams.toString();
        const url = query ? `/transport-mobilizations?${query}` : '/transport-mobilizations';
        const response = await api.get(url);
        return response.data;
    }

    async findById(id: string): Promise<TransportMobilization> {
        const response = await api.get(`/transport-mobilizations/${id}`);
        return response.data;
    }

    async create(dto: CreateTransportMobilizationDTO): Promise<TransportMobilization> {
        const response = await api.post('/transport-mobilizations', dto);
        return response.data;
    }

    async update(id: string, dto: Partial<CreateTransportMobilizationDTO>): Promise<TransportMobilization> {
        const response = await api.put(`/transport-mobilizations/${id}`, dto);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/transport-mobilizations/${id}`);
    }

    async uploadOdometerPhoto(id: string, file: File): Promise<TransportMobilization> {
        const formData = new FormData();
        formData.append('photo', file);
        const response = await api.post(`/transport-mobilizations/${id}/odometer-photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }

    async uploadPhotos(id: string, files: File[]): Promise<TransportMobilization> {
        if (!files.length) return this.findById(id);
        const formData = new FormData();
        files.forEach((f) => formData.append('photos', f));
        const response = await api.post(`/transport-mobilizations/${id}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }
}

export default new TransportMobilizationService();
