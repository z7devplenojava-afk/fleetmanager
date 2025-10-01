export interface ActivityReport {
  id: string;
  employeeId: string;
  employeeName: string;
  clientId: string;
  clientName: string;
  workPostId: string;
  workPostName: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  ballisticPlate?: {
    number: string;
    validUntil: string; // 6 anos de validade
  };
  weaponRegistry?: {
    number: string;
    validUntil: string;
  };
  absenceStatus?: 'PRESENT' | 'ABSENT' | 'LATE' | 'MEDICAL_LEAVE' | 'JUSTIFIED';
  divergences?: string;
  medicalConsultation?: {
    date: string;
    reason: string;
    doctor: string;
    result: string;
  };
  photos: ActivityPhoto[];
  documents: ActivityDocument[];
  supervisorId?: string;
  supervisorName?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface ActivityPhoto {
  id: string;
  url: string;
  description: string;
  timestamp: string;
}

export interface ActivityDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface CreateActivityReportDTO {
  employeeId: string;
  clientId: string;
  workPostId: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  ballisticPlate?: {
    number: string;
    validUntil: string;
  };
  weaponRegistry?: {
    number: string;
    validUntil: string;
  };
  absenceStatus?: string;
  divergences?: string;
  medicalConsultation?: {
    date: string;
    reason: string;
    doctor: string;
    result: string;
  };
}

export interface ActivityReportFilters {
  employeeId?: string;
  clientId?: string;
  workPostId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  supervisorId?: string;
}