import api from '@/lib/axios';

export interface TravelTrip {
    id: string;
    name: string;
    code?: string;
    tripType: 'FRETADO' | 'TURISTICO';
    legs: number;
    leg1Description?: string;
    leg2Description?: string;
    leg3Description?: string;
    leg4Description?: string;
    estimatedDuration?: number | string;
    durationMultiplier?: number;
    distanceKm?: number;
    route?: { id: string; name?: string };
    client?: { id: string; name?: string };
    originAddress?: string;
    destinationAddress?: string;
    observations?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
    createdAt?: string;
    updatedAt?: string;
}

class TravelTripService {
    async findAll(): Promise<TravelTrip[]> {
        const response = await api.get('/api/travel-trips');
        return response.data;
    }

    async findActive(): Promise<TravelTrip[]> {
        const response = await api.get('/api/travel-trips/active');
        return response.data;
    }

    async findById(id: string): Promise<TravelTrip> {
        const response = await api.get(`/api/travel-trips/${id}`);
        return response.data;
    }

    async findByClient(clientId: string): Promise<TravelTrip[]> {
        const response = await api.get(`/api/travel-trips/client/${clientId}`);
        return response.data;
    }

    async create(trip: Partial<TravelTrip>): Promise<TravelTrip> {
        const response = await api.post('/api/travel-trips', trip);
        return response.data;
    }

    async update(id: string, trip: Partial<TravelTrip>): Promise<TravelTrip> {
        const response = await api.put(`/api/travel-trips/${id}`, trip);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/api/travel-trips/${id}`);
    }
}

export const travelTripService = new TravelTripService();
