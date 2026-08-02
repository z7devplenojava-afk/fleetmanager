import api from '@/lib/axios';

export interface ClientDocumentationSummary {
  id: string;
  clientId: string;
  clientName: string;
  companyId: string;
  year: number;
  month: number;
  stageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDocFile {
  id: string;
  stageId: string;
  categoryId: string;
  categoryName: string;
  originalName: string;
  displaySize: string;
  mimeType: string;
  uploadedBy: string;
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

export interface ClientDocStageWithFiles {
  id: string;
  name: string;
  sortOrder: number;
  categories: {
    category: ClientDocCategory;
    files: ClientDocFile[];
  }[];
}

export interface ClientDocumentationStructure {
  documentation: ClientDocumentationSummary;
  stages: ClientDocStageWithFiles[];
}

export interface ClientTimelineEvent {
    id: string;
    type: 'BOARDING' | 'DEBOARDING' | 'START_ROUTE' | 'STOP_ROUTE' | 'ALERT' | 'MESSAGE';
    title: string;
    description: string;
    timestamp: string;
    vehiclePlate: string;
    employeeName?: string;
    icon: string;
    status: 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO';
}

export interface ClientSnapshot {
    vehicleId: string;
    vehiclePlate: string;
    cameraLabel: string;
    imageUrl: string;
    timestamp: string;
    status: 'ONLINE' | 'OFFLINE' | 'LOADING';
    batteryLevel: number;
    lastPosition: string;
}

export interface ClientRoute {
    id: string;
    name: string;
    status: 'ACTIVE' | 'SCHEDULED' | 'COMPLETED' | 'DELAYED';
    vehiclePlate: string;
    driverName: string;
    driverPhotoUrl?: string;
    progress: number;
    startTime: string;
    estimatedEndTime: string;
    passengersOnBoard: number;
    totalSeats: number;
    currentLocation: string;
    nextStops: string[];
}

class ClientAreaService {
    async getActiveRoutes(): Promise<ClientRoute[]> {
        const response = await api.get('/api/client-area/routes/active');
        return response.data;
    }

    async getRouteTimeline(routeId: string): Promise<ClientTimelineEvent[]> {
        const response = await api.get(`/api/client-area/routes/${routeId}/timeline`);
        return response.data;
    }

    async getCameraSnapshot(vehicleId: string): Promise<ClientSnapshot> {
        const response = await api.get(`/api/client-area/vehicles/${vehicleId}/snapshot`);
        return response.data;
    }

    // ===== Documentação Mensal (área do cliente) =====

    async listDocumentations(): Promise<ClientDocumentationSummary[]> {
        const response = await api.get('/api/client-area/documentation');
        return response.data;
    }

    async getDocumentationStructure(documentationId: string): Promise<ClientDocumentationStructure> {
        const response = await api.get(`/api/client-area/documentation/${documentationId}/structure`);
        return response.data;
    }

    async downloadDocumentationFile(fileId: string): Promise<Blob> {
        const response = await api.get(`/api/client-area/documentation/files/${fileId}/download`, {
            responseType: 'blob',
        });
        return response.data;
    }
}

export const clientAreaService = new ClientAreaService();
