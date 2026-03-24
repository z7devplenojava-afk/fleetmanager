export type ChecklistResponse = 'C' | 'NC' | 'NA';

export interface ClientChecklistTemplateItem {
  id: string;
  title: string;
  orderIndex: number;
  required: boolean;
}

export interface ClientChecklistTemplate {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  revision?: string;
  orderIndex?: number;
  items: ClientChecklistTemplateItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientChecklistTemplateDTO {
  clientId: string;
  name: string;
  revision?: string;
  orderIndex?: number;
  items: { title: string; orderIndex?: number; required?: boolean }[];
}

export interface ClientChecklistRecord {
  id: string;
  templateId: string;
  templateName: string;
  clientId: string;
  clientName: string;
  vehicleId?: string;
  vehiclePlate?: string;
  driverId?: string;
  driverName?: string;
  occurredAt: string;
  kmReading?: number;
  responses: Record<string, ChecklistResponse>;
  observations?: string;
  equipmentReleased?: boolean;
  odometerPhotoUrl?: string;
  odometerPhotoDescription?: string;
  vehiclePhotos?: string;
  inspectorName?: string;
  inspectorSignature?: string;
  driverSignature?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientChecklistRecordDTO {
  templateId: string;
  clientId: string;
  vehicleId?: string;
  driverId?: string;
  occurredAt?: string;
  kmReading?: number;
  responses?: Record<string, ChecklistResponse>;
  observations?: string;
  equipmentReleased?: boolean;
  inspectorName?: string;
  companyId?: string;
}
