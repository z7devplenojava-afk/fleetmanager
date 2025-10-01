import api from '@/lib/axios';

// Tipos para SST
export interface SSTAlert {
  id: string;
  type: 'EPI_VENCIMENTO' | 'EXAME_VENCIMENTO' | 'TREINAMENTO_VENCIMENTO' | 'ACIDENTE' | 'NAO_CONFORMIDADE' | 'CIPA_MANDATO' | 'INSPECAO_PENDENTE' | 'QUASE_ACIDENTE';
  title: string;
  message: string;
  priority: 1 | 2 | 3 | 4; // 1=Baixa, 2=Média, 3=Alta, 4=Crítica
  employeeId?: string;
  employeeName?: string;
  dueDate?: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SSTDashboardSummary {
  totalAlerts: number;
  unreadAlerts: number;
  overdueAlerts: number;
  totalEmployees: number;
  asoUpToDate: number;
  asoExpiring: number;
  epiValid: number;
  epiExpiring: number;
  accidentsThisMonth: number;
  accidentsLastMonth: number;
  trainingPending: number;
  inspectionPending: number;
  cipaMembers: number;
  cipaExpiring: number;
}

export interface OccupationalRisk {
  id: string;
  name: string;
  description: string;
  category: 'FISICO' | 'QUIMICO' | 'BIOLOGICO' | 'ERGONOMICO' | 'ACIDENTE';
  level: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeRisk {
  id: string;
  employeeId: string;
  employeeName: string;
  riskId: string;
  riskName: string;
  riskLevel: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalExam {
  id: string;
  employeeId: string;
  employeeName: string;
  examType: string;
  examCategory: 'ADMISSIONAL' | 'PERIODICO' | 'RETORNO' | 'MUDANCA_FUNCAO' | 'DEMISSIONAL';
  scheduledDate: string;
  performedDate?: string;
  status: 'PENDENTE' | 'REALIZADO' | 'ATRASADO' | 'CANCELADO';
  result?: 'APTO' | 'INAPTO' | 'APTO_COM_RESTRICOES';
  doctorName?: string;
  clinicName?: string;
  notes?: string;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SSTTraining {
  id: string;
  name: string;
  description: string;
  trainingType: string;
  provider: string;
  duration: number; // em horas
  validityMonths: number;
  isMandatory: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingParticipation {
  id: string;
  employeeId: string;
  employeeName: string;
  trainingId: string;
  trainingName: string;
  scheduledDate: string;
  completionDate?: string;
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'REPROVADO' | 'CANCELADO';
  score?: number;
  certificateUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccidentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  accidentType: 'COM_AFASTAMENTO' | 'SEM_AFASTAMENTO' | 'MORTAL' | 'TRAJETO';
  accidentDate: string;
  description: string;
  location: string;
  injuryDescription?: string;
  status: 'REGISTRADO' | 'INVESTIGADO' | 'ENCERRADO';
  catNumber?: string;
  investigationNotes?: string;
  correctiveActions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalProtectiveEquipment {
  id: string;
  name: string;
  description: string;
  category: 'CABECA' | 'OLHOS' | 'AUDITIVO' | 'RESPIRATORIO' | 'MAOS' | 'PES' | 'CORPO';
  caNumber: string;
  validityMonths: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EPIDelivery {
  id: string;
  employeeId: string;
  employeeName: string;
  epiId: string;
  epiName: string;
  deliveryDate: string;
  quantity: number;
  reason: 'ADMISSAO' | 'REPOSICAO' | 'TROCA' | 'PERDA' | 'DANO';
  notes?: string;
  deliveredBy: string;
  createdAt: string;
  updatedAt: string;
}

// DTOs para criação/atualização
export interface CreateMedicalExamDTO {
  employeeId: string;
  examType: string;
  examCategory: string;
  scheduledDate: string;
  doctorName?: string;
  clinicName?: string;
  notes?: string;
}

export interface CreateTrainingParticipationDTO {
  employeeId: string;
  trainingId: string;
  scheduledDate: string;
  notes?: string;
}

export interface CreateAccidentRecordDTO {
  employeeId: string;
  accidentType: string;
  accidentDate: string;
  description: string;
  location: string;
  injuryDescription?: string;
  catNumber?: string;
}

export interface CreateEPIDeliveryDTO {
  employeeId: string;
  epiId: string;
  deliveryDate: string;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface AssociateRiskToEmployeeDTO {
  employeeId: string;
  riskId: string;
  riskLevel: string;
  notes?: string;
}

// Serviço SST
export const sstService = {
  // Dashboard
  async getDashboardSummary(): Promise<SSTDashboardSummary> {
    const response = await api.get('/api/sst/dashboard/summary');
    return response.data;
  },

  // Alertas
  async getAlerts(): Promise<SSTAlert[]> {
    const response = await api.get('/api/sst/alerts');
    return response.data;
  },

  async getAlertsByEmployee(employeeId: string): Promise<SSTAlert[]> {
    const response = await api.get(`/sst/alerts/employee/${employeeId}`);
    return response.data;
  },

  async getUnreadAlerts(employeeId: string): Promise<SSTAlert[]> {
    const response = await api.get(`/sst/alerts/unread/employee/${employeeId}`);
    return response.data;
  },

  async getOverdueAlerts(): Promise<SSTAlert[]> {
    const response = await api.get('/api/sst/alerts/overdue');
    return response.data;
  },

  async markAlertAsRead(alertId: string): Promise<void> {
    await api.post(`/sst/alerts/${alertId}/read`);
  },

  async markAlertAsResolved(alertId: string): Promise<void> {
    await api.post(`/sst/alerts/${alertId}/resolve`);
  },

  async getUnreadAlertsCount(employeeId: string): Promise<number> {
    const response = await api.get(`/sst/alerts/count/unread/employee/${employeeId}`);
    return response.data;
  },

  // Riscos Ocupacionais
  async getOccupationalRisks(): Promise<OccupationalRisk[]> {
    const response = await api.get('/api/sst/risks');
    return response.data;
  },

  async getOccupationalRiskById(id: string): Promise<OccupationalRisk> {
    const response = await api.get(`/sst/risks/${id}`);
    return response.data;
  },

  async createOccupationalRisk(risk: Partial<OccupationalRisk>): Promise<OccupationalRisk> {
    const response = await api.post('/api/sst/risks', risk);
    return response.data;
  },

  async updateOccupationalRisk(id: string, risk: Partial<OccupationalRisk>): Promise<OccupationalRisk> {
    const response = await api.put(`/sst/risks/${id}`, risk);
    return response.data;
  },

  async deleteOccupationalRisk(id: string): Promise<void> {
    await api.delete(`/sst/risks/${id}`);
  },

  async getEmployeeRisks(employeeId: string): Promise<EmployeeRisk[]> {
    const response = await api.get(`/sst/risks/employee/${employeeId}`);
    return response.data;
  },

  async associateRiskToEmployee(data: AssociateRiskToEmployeeDTO): Promise<EmployeeRisk> {
    const response = await api.post('/api/sst/risks/associate-employee', data);
    return response.data;
  },

  async associateRiskToPosition(positionId: string, riskId: string, riskLevel: string): Promise<void> {
    await api.post('/api/sst/risks/associate-position', {
      positionId,
      riskId,
      riskLevel
    });
  },

  async copyRisksFromPositionToEmployee(employeeId: string, positionId: string): Promise<void> {
    await api.post('/api/sst/risks/copy-position-to-employee', {
      employeeId,
      positionId
    });
  },

  // Exames Médicos
  async getMedicalExams(): Promise<MedicalExam[]> {
    const response = await api.get('/api/sst/medical-exams');
    return response.data;
  },

  async getMedicalExamById(id: string): Promise<MedicalExam> {
    const response = await api.get(`/sst/medical-exams/${id}`);
    return response.data;
  },

  async createMedicalExam(exam: CreateMedicalExamDTO): Promise<MedicalExam> {
    const response = await api.post('/api/sst/medical-exams', exam);
    return response.data;
  },

  async updateMedicalExam(id: string, exam: Partial<MedicalExam>): Promise<MedicalExam> {
    const response = await api.put(`/sst/medical-exams/${id}`, exam);
    return response.data;
  },

  async deleteMedicalExam(id: string): Promise<void> {
    await api.delete(`/sst/medical-exams/${id}`);
  },

  async getMedicalExamsByEmployee(employeeId: string): Promise<MedicalExam[]> {
    const response = await api.get(`/sst/medical-exams/employee/${employeeId}`);
    return response.data;
  },

  async getMedicalExamsByStatus(status: string): Promise<MedicalExam[]> {
    const response = await api.get(`/sst/medical-exams/status/${status}`);
    return response.data;
  },

  async getMedicalExamsByCategory(category: string): Promise<MedicalExam[]> {
    const response = await api.get(`/sst/medical-exams/category/${category}`);
    return response.data;
  },

  async getExpiringMedicalExams(days: number = 30): Promise<MedicalExam[]> {
    const response = await api.get(`/sst/medical-exams/expiring/${days}`);
    return response.data;
  },

  // Treinamentos
  async getSSTTrainings(): Promise<SSTTraining[]> {
    const response = await api.get('/api/sst/trainings');
    return response.data;
  },

  async getSSTTrainingById(id: string): Promise<SSTTraining> {
    const response = await api.get(`/sst/trainings/${id}`);
    return response.data;
  },

  async createSSTTraining(training: Partial<SSTTraining>): Promise<SSTTraining> {
    const response = await api.post('/api/sst/trainings', training);
    return response.data;
  },

  async updateSSTTraining(id: string, training: Partial<SSTTraining>): Promise<SSTTraining> {
    const response = await api.put(`/sst/trainings/${id}`, training);
    return response.data;
  },

  async deleteSSTTraining(id: string): Promise<void> {
    await api.delete(`/sst/trainings/${id}`);
  },

  async getTrainingParticipations(): Promise<TrainingParticipation[]> {
    const response = await api.get('/api/sst/training-participations');
    return response.data;
  },

  async getTrainingParticipationById(id: string): Promise<TrainingParticipation> {
    const response = await api.get(`/sst/training-participations/${id}`);
    return response.data;
  },

  async createTrainingParticipation(participation: CreateTrainingParticipationDTO): Promise<TrainingParticipation> {
    const response = await api.post('/api/sst/training-participations', participation);
    return response.data;
  },

  async updateTrainingParticipation(id: string, participation: Partial<TrainingParticipation>): Promise<TrainingParticipation> {
    const response = await api.put(`/sst/training-participations/${id}`, participation);
    return response.data;
  },

  async deleteTrainingParticipation(id: string): Promise<void> {
    await api.delete(`/sst/training-participations/${id}`);
  },

  async getTrainingParticipationsByEmployee(employeeId: string): Promise<TrainingParticipation[]> {
    const response = await api.get(`/sst/training-participations/employee/${employeeId}`);
    return response.data;
  },

  async getExpiredOrExpiringTrainings(days: number = 30): Promise<TrainingParticipation[]> {
    const response = await api.get(`/sst/training-participations/expired-or-expiring/${days}`);
    return response.data;
  },

  // Acidentes
  async getAccidentRecords(): Promise<AccidentRecord[]> {
    const response = await api.get('/api/sst/accidents');
    return response.data;
  },

  async getAccidentRecordById(id: string): Promise<AccidentRecord> {
    const response = await api.get(`/sst/accidents/${id}`);
    return response.data;
  },

  async createAccidentRecord(accident: CreateAccidentRecordDTO): Promise<AccidentRecord> {
    const response = await api.post('/api/sst/accidents', accident);
    return response.data;
  },

  async updateAccidentRecord(id: string, accident: Partial<AccidentRecord>): Promise<AccidentRecord> {
    const response = await api.put(`/sst/accidents/${id}`, accident);
    return response.data;
  },

  async deleteAccidentRecord(id: string): Promise<void> {
    await api.delete(`/sst/accidents/${id}`);
  },

  async getAccidentRecordsByEmployee(employeeId: string): Promise<AccidentRecord[]> {
    const response = await api.get(`/sst/accidents/employee/${employeeId}`);
    return response.data;
  },

  async getAccidentRecordsByType(type: string): Promise<AccidentRecord[]> {
    const response = await api.get(`/sst/accidents/type/${type}`);
    return response.data;
  },

  async getAccidentRecordsByStatus(status: string): Promise<AccidentRecord[]> {
    const response = await api.get(`/sst/accidents/status/${status}`);
    return response.data;
  },

  async getAccidentStatistics(): Promise<any> {
    const response = await api.get('/api/sst/accidents/statistics');
    return response.data;
  },

  // EPIs
  async getPersonalProtectiveEquipments(): Promise<PersonalProtectiveEquipment[]> {
    const response = await api.get('/api/sst/epis');
    return response.data;
  },

  async getPersonalProtectiveEquipmentById(id: string): Promise<PersonalProtectiveEquipment> {
    const response = await api.get(`/sst/epis/${id}`);
    return response.data;
  },

  async createPersonalProtectiveEquipment(epi: Partial<PersonalProtectiveEquipment>): Promise<PersonalProtectiveEquipment> {
    const response = await api.post('/api/sst/epis', epi);
    return response.data;
  },

  async updatePersonalProtectiveEquipment(id: string, epi: Partial<PersonalProtectiveEquipment>): Promise<PersonalProtectiveEquipment> {
    const response = await api.put(`/sst/epis/${id}`, epi);
    return response.data;
  },

  async deletePersonalProtectiveEquipment(id: string): Promise<void> {
    await api.delete(`/sst/epis/${id}`);
  },

  async getEPIDeliveries(): Promise<EPIDelivery[]> {
    const response = await api.get('/api/sst/epi-deliveries');
    return response.data;
  },

  async getEPIDeliveryById(id: string): Promise<EPIDelivery> {
    const response = await api.get(`/sst/epi-deliveries/${id}`);
    return response.data;
  },

  async createEPIDelivery(delivery: CreateEPIDeliveryDTO): Promise<EPIDelivery> {
    const response = await api.post('/api/sst/epi-deliveries', delivery);
    return response.data;
  },

  async updateEPIDelivery(id: string, delivery: Partial<EPIDelivery>): Promise<EPIDelivery> {
    const response = await api.put(`/sst/epi-deliveries/${id}`, delivery);
    return response.data;
  },

  async deleteEPIDelivery(id: string): Promise<void> {
    await api.delete(`/sst/epi-deliveries/${id}`);
  },

  async getEPIDeliveriesByEmployee(employeeId: string): Promise<EPIDelivery[]> {
    const response = await api.get(`/sst/epi-deliveries/employee/${employeeId}`);
    return response.data;
  },

  async getExpiringEPIDeliveries(days: number = 30): Promise<EPIDelivery[]> {
    const response = await api.get(`/sst/epi-deliveries/expiring/${days}`);
    return response.data;
  }
};

