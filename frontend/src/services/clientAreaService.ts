import api from '@/lib/axios';

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
}

export const clientAreaService = new ClientAreaService();
