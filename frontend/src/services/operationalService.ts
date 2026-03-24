import api from '@/lib/axios';

// Interfaces para Vacation Coverage
export interface VacationCoverage {
  id: string;
  employee: {
    id: string;
    name: string;
  };
  substituteEmployee?: {
    id: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'NO_COVERAGE';
  location?: {
    id: string;
    name: string;
  };
  shift: 'DAY' | 'NIGHT' | 'MIXED';
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVacationCoverageDTO {
  employeeId: string;
  substituteEmployeeId?: string;
  startDate: string;
  endDate: string;
  locationId?: string;
  shift: 'DAY' | 'NIGHT' | 'MIXED';
  observations?: string;
}

// Interfaces para Absence
export interface Absence {
  id: string;
  employee: {
    id: string;
    name: string;
  };
  absenceDate: string;
  absenceType: 'SICK_LEAVE' | 'PERSONAL_LEAVE' | 'UNAUTHORIZED' | 'MEDICAL_APPOINTMENT' | 'FAMILY_EMERGENCY' | 'WEDDING' | 'OTHER';
  reason: string;
  medicalCertificateDays?: number;
  documentUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  isJustified: boolean;
  coverageEmployee?: {
    id: string;
    name: string;
  };
  coverageNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAbsenceDTO {
  employeeId: string;
  absenceDate: string;
  absenceType: 'SICK_LEAVE' | 'PERSONAL_LEAVE' | 'UNAUTHORIZED' | 'MEDICAL_APPOINTMENT' | 'FAMILY_EMERGENCY' | 'WEDDING' | 'OTHER';
  reason: string;
  medicalCertificateDays?: number;
  documentUrl?: string;
  coverageEmployeeId?: string;
  coverageNotes?: string;
}

// Interfaces para Work Post Assignment
export interface WorkPostAssignment {
  id: string;
  employee: {
    id: string;
    name: string;
  };
  workPost: {
    id: string;
    name: string;
  };
  assignmentDate: string;
  shift: 'DAY' | 'NIGHT' | 'MIXED';
  startTime?: string;
  endTime?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkPostAssignmentDTO {
  employeeId: string;
  workPostId: string;
  assignmentDate: string;
  shift: 'DAY' | 'NIGHT' | 'MIXED';
  startTime?: string;
  endTime?: string;
  observations?: string;
}

// Interfaces para Specific Activity
export interface SpecificActivity {
  id: string;
  employee: {
    id: string;
    name: string;
  };
  activityType: 'CLEANING' | 'GLASS_CLEANING' | 'LAWN_MOWING' | 'RECYCLING' | 'MAINTENANCE' | 'SECURITY_PATROL' | 'EQUIPMENT_CHECK' | 'SPECIAL_EVENT' | 'TRAINING' | 'MEETING' | 'OTHER';
  activityDate: string;
  startTime?: string;
  endTime?: string;
  location?: {
    id: string;
    name: string;
  };
  description?: string;
  observations?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED' | 'OVERDUE';
  isCompleted: boolean;
  completionNotes?: string;
  assignedBy?: {
    id: string;
    name: string;
  };
  supervisedBy?: {
    id: string;
    name: string;
  };
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpecificActivityDTO {
  employeeId: string;
  activityType: 'CLEANING' | 'GLASS_CLEANING' | 'LAWN_MOWING' | 'RECYCLING' | 'MAINTENANCE' | 'SECURITY_PATROL' | 'EQUIPMENT_CHECK' | 'SPECIAL_EVENT' | 'TRAINING' | 'MEETING' | 'OTHER';
  activityDate: string;
  startTime?: string;
  endTime?: string;
  locationId?: string;
  description?: string;
  observations?: string;
}

class OperationalService {
  // Vacation Coverage Methods
  async getAllVacationCoverages(): Promise<VacationCoverage[]> {
    const response = await api.get('/api/vacation-coverages');
    return response.data;
  }

  async getVacationCoverageById(id: string): Promise<VacationCoverage> {
    const response = await api.get(`/api/vacation-coverages/${id}`);
    return response.data;
  }

  async getVacationCoveragesByEmployee(employeeId: string): Promise<VacationCoverage[]> {
    const response = await api.get(`/api/vacation-coverages/employee/${employeeId}`);
    return response.data;
  }

  async getVacationCoveragesNeedingAttention(): Promise<VacationCoverage[]> {
    const response = await api.get('/api/vacation-coverages/needing-attention');
    return response.data;
  }

  async createVacationCoverage(data: CreateVacationCoverageDTO): Promise<VacationCoverage> {
    // Enviar DTO simples com IDs
    const payload = {
      employeeId: data.employeeId,
      substituteEmployeeId: data.substituteEmployeeId || null,
      startDate: data.startDate,
      endDate: data.endDate,
      locationId: data.locationId || null,
      shift: data.shift,
      observations: data.observations || null,
    };
    const response = await api.post('/api/vacation-coverages', payload);
    return response.data;
  }

  async updateVacationCoverage(id: string, data: Partial<CreateVacationCoverageDTO>): Promise<VacationCoverage> {
    // Enviar DTO simples com IDs
    const payload: any = {
      employeeId: data.employeeId,
      substituteEmployeeId: data.substituteEmployeeId || null,
      startDate: data.startDate,
      endDate: data.endDate,
      locationId: data.locationId || null,
      shift: data.shift,
      observations: data.observations || null,
    };
    const response = await api.put(`/api/vacation-coverages/${id}`, payload);
    return response.data;
  }

  async updateVacationCoverageStatus(id: string, status: string): Promise<VacationCoverage> {
    const response = await api.put(`/api/vacation-coverages/${id}/status?status=${status}`);
    return response.data;
  }

  async deleteVacationCoverage(id: string): Promise<void> {
    await api.delete(`/api/vacation-coverages/${id}`);
  }

  // Absence Methods
  async getAllAbsences(): Promise<Absence[]> {
    const response = await api.get('/api/absences');
    return response.data;
  }

  async getAbsenceById(id: string): Promise<Absence> {
    const response = await api.get(`/api/absences/${id}`);
    return response.data;
  }

  async getAbsencesByEmployee(employeeId: string): Promise<Absence[]> {
    const response = await api.get(`/api/absences/employee/${employeeId}`);
    return response.data;
  }

  async getPendingAbsences(): Promise<Absence[]> {
    const response = await api.get('/api/absences/pending');
    return response.data;
  }

  async getTodayAbsences(): Promise<Absence[]> {
    const response = await api.get('/api/absences/today');
    return response.data;
  }

  async createAbsence(data: CreateAbsenceDTO): Promise<Absence> {
    const response = await api.post('/api/absences', data);
    return response.data;
  }

  async updateAbsence(id: string, data: Partial<CreateAbsenceDTO>): Promise<Absence> {
    const response = await api.put(`/api/absences/${id}`, data);
    return response.data;
  }

  async approveAbsence(id: string, approvedByEmployeeId: string): Promise<Absence> {
    const response = await api.put(`/api/absences/${id}/approve?approvedByEmployeeId=${approvedByEmployeeId}`);
    return response.data;
  }

  async rejectAbsence(id: string, reason: string): Promise<Absence> {
    const response = await api.put(`/api/absences/${id}/reject?reason=${encodeURIComponent(reason)}`);
    return response.data;
  }

  async deleteAbsence(id: string): Promise<void> {
    await api.delete(`/api/absences/${id}`);
  }

  // Work Post Assignment Methods
  async getAllWorkPostAssignments(): Promise<WorkPostAssignment[]> {
    const response = await api.get('/api/work-post-assignments');
    return response.data;
  }

  async getWorkPostAssignmentById(id: string): Promise<WorkPostAssignment> {
    const response = await api.get(`/api/work-post-assignments/${id}`);
    return response.data;
  }

  async getWorkPostAssignmentsByEmployee(employeeId: string): Promise<WorkPostAssignment[]> {
    const response = await api.get(`/api/work-post-assignments/employee/${employeeId}`);
    return response.data;
  }

  async getTodayAssignments(): Promise<WorkPostAssignment[]> {
    const response = await api.get('/api/work-post-assignments/today');
    return response.data;
  }

  async getPendingAssignments(): Promise<WorkPostAssignment[]> {
    const response = await api.get('/api/work-post-assignments/pending');
    return response.data;
  }

  async createWorkPostAssignment(data: CreateWorkPostAssignmentDTO): Promise<WorkPostAssignment> {
    // Enviar DTO simples com IDs
    const payload = {
      employeeId: data.employeeId,
      workPostId: data.workPostId,
      assignmentDate: data.assignmentDate,
      shiftType: data.shift,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      isPrimaryAssignment: true,
      isBackupAssignment: false,
      observations: data.observations || null,
      specialInstructions: null,
    };
    const response = await api.post('/api/work-post-assignments', payload);
    return response.data;
  }

  async updateWorkPostAssignment(id: string, data: Partial<CreateWorkPostAssignmentDTO>): Promise<WorkPostAssignment> {
    // Enviar DTO simples com IDs
    const payload: any = {
      employeeId: data.employeeId,
      workPostId: data.workPostId,
      assignmentDate: data.assignmentDate,
      shiftType: data.shift,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      observations: data.observations || null,
      specialInstructions: null,
    };
    
    const response = await api.put(`/api/work-post-assignments/${id}`, payload);
    return response.data;
  }

  async updateAssignmentStatus(id: string, status: string): Promise<WorkPostAssignment> {
    // Mapear status do frontend para o backend
    const statusMap: Record<string, string> = {
      'SCHEDULED': 'PENDING',
      'CONFIRMED': 'CONFIRMED',
      'ACTIVE': 'ACTIVE',
      'COMPLETED': 'COMPLETED',
      'CANCELLED': 'CANCELLED'
    };
    
    const backendStatus = statusMap[status] || status;
    const response = await api.put(`/api/work-post-assignments/${id}/status?status=${backendStatus}`);
    return response.data;
  }

  async confirmAssignment(id: string): Promise<WorkPostAssignment> {
    const response = await api.put(`/api/work-post-assignments/${id}/confirm`);
    return response.data;
  }

  async completeAssignment(id: string): Promise<WorkPostAssignment> {
    const response = await api.put(`/api/work-post-assignments/${id}/complete`);
    return response.data;
  }

  async deleteWorkPostAssignment(id: string): Promise<void> {
    await api.delete(`/api/work-post-assignments/${id}`);
  }

  // Specific Activity Methods
  async getAllSpecificActivities(): Promise<SpecificActivity[]> {
    const response = await api.get('/api/specific-activities');
    return response.data;
  }

  async getSpecificActivityById(id: string): Promise<SpecificActivity> {
    const response = await api.get(`/api/specific-activities/${id}`);
    return response.data;
  }

  async getSpecificActivitiesByEmployee(employeeId: string): Promise<SpecificActivity[]> {
    const response = await api.get(`/api/specific-activities/employee/${employeeId}`);
    return response.data;
  }

  async getTodayActivities(): Promise<SpecificActivity[]> {
    const response = await api.get('/api/specific-activities/today');
    return response.data;
  }

  async getPendingActivities(): Promise<SpecificActivity[]> {
    const response = await api.get('/api/specific-activities/pending');
    return response.data;
  }

  async getOverdueActivities(): Promise<SpecificActivity[]> {
    const response = await api.get('/api/specific-activities/overdue');
    return response.data;
  }

  async createSpecificActivity(data: CreateSpecificActivityDTO): Promise<SpecificActivity> {
    // Enviar DTO simples com IDs
    const payload = {
      employeeId: data.employeeId,
      activityType: data.activityType,
      activityDate: data.activityDate,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      locationId: data.locationId || null,
      description: data.description || null,
      observations: data.observations || null,
    };
    const response = await api.post('/api/specific-activities', payload);
    return response.data;
  }

  async updateSpecificActivity(id: string, data: Partial<CreateSpecificActivityDTO>): Promise<SpecificActivity> {
    // Enviar DTO simples com IDs
    const payload: any = {
      employeeId: data.employeeId,
      activityType: data.activityType,
      activityDate: data.activityDate,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      locationId: data.locationId || null,
      description: data.description || null,
      observations: data.observations || null,
    };
    const response = await api.put(`/api/specific-activities/${id}`, payload);
    return response.data;
  }

  async startActivity(id: string): Promise<SpecificActivity> {
    const response = await api.put(`/api/specific-activities/${id}/start`);
    return response.data;
  }

  async completeActivity(id: string, observations?: string): Promise<SpecificActivity> {
    const params = observations ? `?observations=${encodeURIComponent(observations)}` : '';
    const response = await api.put(`/api/specific-activities/${id}/complete${params}`);
    return response.data;
  }

  async deleteSpecificActivity(id: string): Promise<void> {
    await api.delete(`/api/specific-activities/${id}`);
  }
}

export const operationalService = new OperationalService();
