import api from './api';

export interface Trip {
    id: string;
    scheduleId: string;
    status: 'PLANNED' | 'STARTING' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED' | 'CANCELLED';
    startTime?: string;
    endTime?: string;
    currentLat?: number;
    currentLng?: number;
}

export type OperationalTripStatus =
    | 'PLANNED'
    | 'STARTING'
    | 'BOARDING'
    | 'ARRIVING'
    | 'IN_PROGRESS'
    | 'PAUSED'
    | 'FINISHED'
    | 'CANCELLED';

/** Viagem operacional (PRD VSS - Fase 3). */
export interface OperationalTrip {
    id: string;
    scheduleId?: string;
    escalaId?: string;
    status: OperationalTripStatus;
    tripDate?: string;
    plannedDepartureTime?: string; // HH:mm:ss
    plannedArrivalTime?: string;
    startTime?: string;
    endTime?: string;
    routeId?: string;
    routeName?: string;
    routeColor?: string;
    routeCapacity?: number;
    vehicleId?: string;
    vehiclePlate?: string;
    driverId?: string;
    driverName?: string;
    initialKm?: number;
    finalKm?: number;
    passengersExpected?: number;
    passengersRealized?: number;
    occurrence?: string;
    driverConfirmedAt?: string;
    vehicleConfirmedAt?: string;
    dailyLogId?: string;
    parteDiariaId?: string;
    parteDiariaNumber?: string;
    delayed: boolean;
}

export interface TripFinishPayload {
    finalKm: number;
    passengersRealized?: number;
    occurrence?: string;
}

export interface BoardingRecord {
    id: string;
    passengerId: string;
    tripId: string;
    pointId: string;
    boardingTime: string;
    geofenceValidated: boolean;
}

export interface TripEventDTO {
    id: string;
    tripId: string;
    tripName: string;
    type: 'TRIP_START' | 'TRIP_END' | 'TRIP_PAUSE' | 'TRIP_RESUME' | 'BOARDING' | 'BOARDING_DENIED_GEOFENCE' | 'DEVIATION' | 'BREAKDOWN' | 'TRAFFIC_JAM' | 'DRIVER_SWAP' | 'VEHICLE_SWAP' | 'OPERATIONAL_PAUSE';
    timestamp: string;
    latitude?: number;
    longitude?: number;
    observations?: string;
    driverName: string;
    vehiclePlate: string;
}

const tripService = {
    startTrip: async (scheduleId: string): Promise<Trip> => {
        const response = await api.post(`/api/trips/start/${scheduleId}`);
        return response.data;
    },

    recordBoarding: async (params: {
        tripId: string;
        pointId: string;
        passengerId: string;
        lat: number;
        lng: number;
    }): Promise<BoardingRecord> => {
        const response = await api.post('/api/boarding/scan', null, { params });
        return response.data;
    },

    getEvents: async (): Promise<TripEventDTO[]> => {
        try {
            const response = await api.get('/api/trips/events');
            return Array.isArray(response.data) ? response.data : [];
        } catch {
            return [];
        }
    },

    // ---------------------------------------------------------------
    // Ciclo de vida operacional (PRD VSS - Fase 3)
    // ---------------------------------------------------------------

    getTrips: async (params: { date?: string; routeId?: string } = {}): Promise<OperationalTrip[]> => {
        const response = await api.get('/api/trips', { params });
        return response.data;
    },

    getTripById: async (id: string): Promise<OperationalTrip> => {
        const response = await api.get(`/api/trips/${id}`);
        return response.data;
    },

    createFromScale: async (scaleId: string): Promise<OperationalTrip> => {
        const response = await api.post(`/api/trips/${scaleId}`);
        return response.data;
    },

    confirmDriver: async (id: string): Promise<OperationalTrip> => {
        const response = await api.post(`/api/trips/${id}/confirm-driver`);
        return response.data;
    },

    confirmVehicle: async (id: string): Promise<OperationalTrip> => {
        const response = await api.post(`/api/trips/${id}/confirm-vehicle`);
        return response.data;
    },

    startTripById: async (id: string): Promise<OperationalTrip> => {
        const response = await api.post(`/api/trips/${id}/start`);
        return response.data;
    },

    arrive: async (id: string): Promise<OperationalTrip> => {
        const response = await api.post(`/api/trips/${id}/arrive`);
        return response.data;
    },

    finish: async (id: string, payload: TripFinishPayload): Promise<OperationalTrip> => {
        const response = await api.post(`/api/trips/${id}/finish`, payload);
        return response.data;
    },

    cancel: async (id: string, reason?: string): Promise<OperationalTrip> => {
        const response = await api.post(`/api/trips/${id}/cancel`, { reason });
        return response.data;
    }
};

export default tripService;
