export interface Passenger {
  id: string;
  registration: string;
  name: string;
  employeeId?: string;
  companyId?: string;
  clientId?: string;
  clientName?: string;
  userId?: string;
  routeId?: string;
  routeName?: string;
  boardingPointId?: string;
  boardingPointName?: string;
  returnRouteId?: string;
  returnRouteName?: string;
  returnBoardingPointId?: string;
  returnBoardingPointName?: string;
  shift?: string;
  active: boolean;
  status?: string; // 'ATIVO' | 'BLOQUEADO' | 'DEMITIDO' | 'INATIVO'
  multipleRoutesAllowed?: boolean;
  costCenter?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  /** COMUM, ESTUDANTE, IDOSO, PCD */
  passengerType?: string;
  /** HH:mm:ss */
  preferredTime?: string;
  notificationsEnabled?: boolean;
  qrCodeToken?: string;
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
  direction?: string;
  validationMode?: string;
  isSyncedOffline?: boolean;
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
