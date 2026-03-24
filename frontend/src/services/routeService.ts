import api from '@/lib/axios';

export interface RoutePoint {
    id?: string;
    routeId?: string;
    name: string;
    latitude: number;
    longitude: number;
    order: number;
    type: 'START' | 'BOARDING' | 'DEBARKATION' | 'END';
    radiusMeters?: number;
}

export interface Route {
    id: string;
    name: string;
    description?: string;
    unit: { id: string; name?: string };
    location: { id: string; name?: string };
    estimatedDuration: number; // Seconds
    checkpointsRequired: boolean;
    geofenceEnabled: boolean;
    defaultRadiusMeters?: number;
    points?: RoutePoint[];
    code?: string;
    originCep?: string;
    originAddress?: string;
    destinationCep?: string;
    destinationAddress?: string;
    shift?: string;
    executionTime?: string;
    distanceKm?: number;
    createdAt?: string;
    updatedAt?: string;
}

class RouteService {
    async findAllRoutes(): Promise<Route[]> {
        const response = await api.get('/api/routes');
        return response.data;
    }

    async findRouteById(id: string): Promise<Route> {
        const response = await api.get(`/api/routes/${id}`);
        return response.data;
    }

    async createRoute(route: Partial<Route>): Promise<Route> {
        const response = await api.post('/api/routes', route);
        return response.data;
    }

    async updateRoute(id: string, route: Partial<Route>): Promise<Route> {
        const response = await api.put(`/api/routes/${id}`, route);
        return response.data;
    }

    async deleteRoute(id: string): Promise<void> {
        await api.delete(`/api/routes/${id}`);
    }
}

export const routeService = new RouteService();
