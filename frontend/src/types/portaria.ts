export type ChecklistType = 'EXIT' | 'ARRIVAL';

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  required: boolean;
  checked: boolean;
  notes?: string;
}

export interface VehicleGateChecklist {
  id: string;
  vehicleId: string;
  vehiclePlate?: string;
  driverId?: string;
  driverName?: string;
  type: ChecklistType;
  occurredAt: string;
  kmReading: number;
  odometerPhotoUrl?: string;
  odometerPhotoDescription?: string;
  checklistData?: string;
  driverProblemReport?: string;
  observations?: string;
  vehiclePhotos?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehicleGateChecklistDTO {
  vehicleId: string;
  driverId?: string;
  type: ChecklistType;
  occurredAt?: string;
  kmReading: number;
  odometerPhotoUrl?: string;
  odometerPhotoDescription?: string;
  checklistData?: string;
  driverProblemReport?: string;
  observations?: string;
  companyId?: string;
}
