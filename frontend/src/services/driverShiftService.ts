import api from '@/lib/axios';

export interface DriverShift {
    id: string;
    driver: { id: string; name: string; licenseNumber?: string; status?: string };
    vehicle?: { id: string; plate?: string; model?: string };
    shiftDate: string;
    plannedStartTime: string;
    plannedEndTime: string;
    actualStartTime?: string;
    actualEndTime?: string;
    breakStartTime?: string;
    breakEndTime?: string;
    totalShiftHours?: number;
    hoursUsed?: number;
    hoursRemaining?: number;
    currentLatitude?: number;
    currentLongitude?: number;
    currentLocationName?: string;
    status: DriverShiftStatus;
    observations?: string;
    availableForReallocation: boolean;
    routeExecutions?: RouteExecution[];
    createdAt?: string;
    updatedAt?: string;
}

export interface RouteExecution {
    id: string;
    route: { id: string; name: string; code?: string; originAddress?: string; destinationAddress?: string };
    driver: { id: string; name: string };
    vehicle?: { id: string; plate?: string };
    plannedStartTime?: string;
    plannedEndTime?: string;
    actualStartTime?: string;
    actualEndTime?: string;
    estimatedDurationMinutes?: number;
    actualDurationMinutes?: number;
    timeDifferenceMinutes?: number;
    estimatedKm?: number;
    actualKm?: number;
    reallocation: boolean;
    executionOrder?: number;
    status: RouteExecutionStatus;
    observations?: string;
    startLatitude?: number;
    startLongitude?: number;
    endLatitude?: number;
    endLongitude?: number;
}

export interface ReallocationSuggestion {
    driverName: string;
    driverId: string;
    routeName: string;
    routeId: string;
    distanceKm: number;
    estimatedTravelMinutes: number;
    estimatedRouteDurationMinutes: number;
    totalTimeNeededMinutes: number;
    availableMinutes: number;
    timeMarginMinutes: number;
    priorityScore: number;
}

export type DriverShiftStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'ON_BREAK' | 'AVAILABLE' | 'COMPLETED' | 'CANCELLED';
export type RouteExecutionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED' | 'REASSIGNED';

class DriverShiftService {
    // CRUD
    async findAll(): Promise<DriverShift[]> {
        const response = await api.get('/api/driver-shifts');
        return response.data;
    }

    async findById(id: string): Promise<DriverShift> {
        const response = await api.get(`/api/driver-shifts/${id}`);
        return response.data;
    }

    async findByDate(date: string): Promise<DriverShift[]> {
        const response = await api.get(`/api/driver-shifts/date/${date}`);
        return response.data;
    }

    async findByDriver(driverId: string, date?: string): Promise<DriverShift[]> {
        const params = date ? { date } : {};
        const response = await api.get(`/api/driver-shifts/driver/${driverId}`, { params });
        return response.data;
    }

    async findByDriverPeriod(driverId: string, start: string, end: string): Promise<DriverShift[]> {
        const response = await api.get(`/api/driver-shifts/driver/${driverId}/period`, {
            params: { start, end }
        });
        return response.data;
    }

    async create(shift: Partial<DriverShift>): Promise<DriverShift> {
        const response = await api.post('/api/driver-shifts', shift);
        return response.data;
    }

    async update(id: string, shift: Partial<DriverShift>): Promise<DriverShift> {
        const response = await api.put(`/api/driver-shifts/${id}`, shift);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/api/driver-shifts/${id}`);
    }

    // Controle de turno
    async startShift(id: string): Promise<DriverShift> {
        const response = await api.post(`/api/driver-shifts/${id}/start`);
        return response.data;
    }

    async endShift(id: string): Promise<DriverShift> {
        const response = await api.post(`/api/driver-shifts/${id}/end`);
        return response.data;
    }

    async startBreak(id: string): Promise<DriverShift> {
        const response = await api.post(`/api/driver-shifts/${id}/break/start`);
        return response.data;
    }

    async endBreak(id: string): Promise<DriverShift> {
        const response = await api.post(`/api/driver-shifts/${id}/break/end`);
        return response.data;
    }

    // Localização
    async updateLocation(id: string, lat: number, lon: number, name?: string): Promise<DriverShift> {
        const response = await api.put(`/api/driver-shifts/${id}/location`, {
            latitude: lat, longitude: lon, locationName: name
        });
        return response.data;
    }

    // Rotas no turno
    async assignRoute(shiftId: string, routeId: string, plannedStart?: string, plannedEnd?: string, isReallocation = false): Promise<RouteExecution> {
        const response = await api.post(`/api/driver-shifts/${shiftId}/routes/${routeId}`, {
            plannedStartTime: plannedStart, plannedEndTime: plannedEnd, isReallocation: String(isReallocation)
        });
        return response.data;
    }

    async startExecution(executionId: string, lat?: number, lon?: number): Promise<RouteExecution> {
        const response = await api.post(`/api/driver-shifts/executions/${executionId}/start`, {
            latitude: lat, longitude: lon
        });
        return response.data;
    }

    async completeExecution(executionId: string, lat?: number, lon?: number, km?: number, obs?: string): Promise<RouteExecution> {
        const response = await api.post(`/api/driver-shifts/executions/${executionId}/complete`, {
            latitude: lat, longitude: lon, actualKm: km, observations: obs
        });
        return response.data;
    }

    // Disponibilidade e Realocação
    async findAvailable(date?: string): Promise<DriverShift[]> {
        const params = date ? { date } : {};
        const response = await api.get('/api/driver-shifts/available', { params });
        return response.data;
    }

    async findAvailableNearby(lat: number, lon: number, radiusKm = 30, minHours = 0.25): Promise<DriverShift[]> {
        const response = await api.get('/api/driver-shifts/available/nearby', {
            params: { latitude: lat, longitude: lon, radiusKm, minHours }
        });
        return response.data;
    }

    async getReallocationSuggestions(date?: string): Promise<ReallocationSuggestion[]> {
        const params = date ? { date } : {};
        const response = await api.get('/api/driver-shifts/reallocation/suggestions', { params });
        return response.data;
    }

    async getSuggestionsForDriver(shiftId: string): Promise<ReallocationSuggestion[]> {
        const response = await api.get(`/api/driver-shifts/${shiftId}/reallocation/suggestions`);
        return response.data;
    }

    async executeReallocation(shiftId: string, routeId: string): Promise<RouteExecution> {
        const response = await api.post(`/api/driver-shifts/${shiftId}/reallocate/${routeId}`);
        return response.data;
    }
}

export const driverShiftService = new DriverShiftService();
