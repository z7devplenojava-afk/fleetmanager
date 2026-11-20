import api from '@/lib/axios';

export interface PassengerTrackingPoint {
  id: string | null;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  order: number | null;
}

export interface PassengerRouteTracking {
  assigned: boolean;
  direction: 'IDA' | 'RETORNO';
  routeId: string | null;
  routeName: string | null;
  color: string | null;
  points: PassengerTrackingPoint[];
  boardingPoint: PassengerTrackingPoint | null;
  vehiclePlate: string | null;
  driverName: string | null;
  vehicleLatitude: number | null;
  vehicleLongitude: number | null;
  locationUpdatedAt: string | null;
  executionStatus: string | null;
  plannedStartTime: string | null;
}

export const passengerTrackingService = {
  async getMyRoute(direction: 'IDA' | 'RETORNO'): Promise<PassengerRouteTracking> {
    const response = await api.get<PassengerRouteTracking>('/api/passengers/me/route-tracking', { params: { direction } });
    return response.data;
  },
};
