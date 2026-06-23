export interface Passenger {
  id: string;
  registration: string;
  name: string;
  employeeId?: string;
  companyId?: string;
  routeId?: string;
  boardingPointId?: string;
  shift?: string;
  active: boolean;
  costCenter?: string;
  createdAt: string;
  updatedAt: string;
}

export type BoardingStatus = 'BOARDED' | 'ABSENT' | 'JUSTIFIED';

export interface Boarding {
  id: string;
  tripId: string;
  passengerId: string;
  vehicleId?: string;
  boardingTime?: string;
  boardingLatitude?: number;
  boardingLongitude?: number;
  boardingPointId?: string;
  status: BoardingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Disembarking {
  id: string;
  boardingId: string;
  disembarkingTime?: string;
  disembarkingLatitude?: number;
  disembarkingLongitude?: number;
  disembarkingPointId?: string;
  createdAt: string;
  updatedAt: string;
}
