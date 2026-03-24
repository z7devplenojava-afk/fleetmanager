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
        const response = await api.get('/api/trips/events');
        return response.data;
    }
};

export default tripService;
