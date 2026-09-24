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
  provider?: string;
  durationHours: number; // em horas
  validityMonths?: number;
  isMandatory: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Campos agregados (quando usar /with-stats)
  totalParticipants?: number;
  scheduledParticipants?: number;
  completedParticipants?: number;
  certificatesExpiring?: number;
  nextScheduledDate?: string;
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
  description?: string;
  category: 'CABECA' | 'OLHOS' | 'AUDITIVO' | 'RESPIRATORIO' | 'MAOS' | 'PES' | 'CORPO';
  caNumber?: string;
  caValidity?: string; // Data de validade do CA
  validityMonths?: number;
  periodicityDays?: number;
  manufacturer?: string;
  model?: string;
  unitOfMeasurement?: string;
  minimumStock?: number;
  currentStock?: number;
  unitCost?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  status?: 'PENDENTE_CONFERENCIA_ALMOXARIFADO' | 'CONCLUIDO' | 'CANCELADO' | string;
  verifiedByAlmoxarifado?: boolean;
  verifiedByAlmoxarifadoAt?: string;
  returnedEpiId?: string;
  returnedEpiName?: string;
  returnedQuantity?: number;
  returnedStockRefunded?: boolean;
  returnedCondition?: 'REAPROVEITAVEL' | 'DESCARTE' | string;
  nextExchangeDate?: string;
  exchangeJustification?: string;
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

export interface CreateSSTTrainingDTO {
  name: string;
  description?: string;
  trainingType: string; // NR_35, CIPA, NR_10, BRIGADA_INCENDIO, etc.
  durationHours: number;
  validityMonths?: number;
  isMandatory?: boolean;
  provider?: string;
  isActive?: boolean;
  requiredForRisks?: string[];
}

export interface CreateTrainingParticipationDTO {
  employeeId: string;
  trainingId: string;
  scheduledDate: string;
  notes?: string;
}

export interface CorrectiveAction {
  id: string;
  title: string;
  description: string;
  origin: 'INSPECAO' | 'ACIDENTE' | 'AUDITORIA' | 'NAO_CONFORMIDADE' | 'OUTROS';
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  responsibleUserId?: string;
  responsibleName?: string;
  dueDate: string;
  completionDate?: string;
  department?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCorrectiveActionDTO {
  title: string;
  description: string;
  origin: 'INSPECAO' | 'ACIDENTE' | 'AUDITORIA' | 'NAO_CONFORMIDADE' | 'OUTROS';
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  status?: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  responsibleUserId?: string;
  responsibleName?: string;
  dueDate: string;
  department?: string;
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
  deliveryDate: string; // Formato: yyyy-MM-dd
  quantity: number;
  reason: string;
  deliveredByUserId?: string; // ID do usuário que está fazendo a entrega
  notes?: string;
  returnedEpiId?: string;
  returnedQuantity?: number;
  returnedCondition?: 'REAPROVEITAVEL' | 'DESCARTE' | string;
  exchangeJustification?: string;
  nextExchangeDate?: string;
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
    const response = await api.get<any[]>('/api/sst/alerts');
    // Normaliza o contrato do backend (alertType + employee objeto) para o formato do frontend
    return (response.data || []).map((a: any) => ({
      ...a,
      type: a.type ?? a.alertType,
      employeeId: a.employeeId ?? a.employee?.id,
      employeeName: a.employeeName ?? a.employee?.name,
    }));
  },

  /**
   * Executa verificação manual de vencimentos SST (ASO, CNH, treinamentos, CA de EPI, CIPA)
   */
  async runAlertCheck(): Promise<Record<string, number>> {
    const response = await api.post<Record<string, number>>('/api/sst-compliance/alerts/run');
    return response.data;
  },

  async getAlertsByEmployee(employeeId: string): Promise<SSTAlert[]> {
    const response = await api.get(`/api/sst/alerts/employee/${employeeId}`);
    return response.data;
  },

  async getUnreadAlerts(employeeId: string): Promise<SSTAlert[]> {
    const response = await api.get(`/api/sst/alerts/unread/employee/${employeeId}`);
    return response.data;
  },

  async getOverdueAlerts(): Promise<SSTAlert[]> {
    const response = await api.get('/api/sst/alerts/overdue');
    return response.data;
  },

  async markAlertAsRead(alertId: string): Promise<void> {
    await api.post(`/api/sst/alerts/${alertId}/read`);
  },

  async markAlertAsResolved(alertId: string): Promise<void> {
    await api.post(`/api/sst/alerts/${alertId}/resolve`);
  },

  async getUnreadAlertsCount(employeeId: string): Promise<number> {
    const response = await api.get(`/api/sst/alerts/count/unread/employee/${employeeId}`);
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

  async getDistinctClinicNames(): Promise<string[]> {
    const response = await api.get('/api/sst/medical-exams/clinics');
    return response.data;
  },

  // Treinamentos
  async getSSTTrainings(): Promise<SSTTraining[]> {
    const response = await api.get('/api/sst/trainings');
    return response.data;
  },

  async getSSTTrainingsWithStats(): Promise<SSTTraining[]> {
    const response = await api.get('/api/sst/trainings/with-stats');
    return response.data;
  },

  async getSSTTrainingById(id: string): Promise<SSTTraining> {
    const response = await api.get(`/api/sst/trainings/${id}`);
    return response.data;
  },

  async createSSTTraining(training: CreateSSTTrainingDTO): Promise<SSTTraining> {
    const response = await api.post('/api/sst/trainings/create', training);
    return response.data;
  },

  async updateSSTTraining(id: string, training: CreateSSTTrainingDTO): Promise<SSTTraining> {
    const response = await api.put(`/api/sst/trainings/${id}/update`, training);
    return response.data;
  },

  async deleteSSTTraining(id: string): Promise<void> {
    await api.delete(`/api/sst/trainings/${id}`);
  },

  async getTrainingParticipations(): Promise<TrainingParticipation[]> {
    const response = await api.get('/api/sst/trainings/participations');
    return response.data;
  },

  async getTrainingParticipationById(id: string): Promise<TrainingParticipation> {
    const response = await api.get(`/api/sst/trainings/participations/${id}`);
    return response.data;
  },

  async createTrainingParticipation(participation: CreateTrainingParticipationDTO): Promise<TrainingParticipation> {
    const response = await api.post('/api/sst/trainings/participations', participation);
    return response.data;
  },

  async updateTrainingParticipation(id: string, participation: Partial<TrainingParticipation>): Promise<TrainingParticipation> {
    const response = await api.put(`/api/sst/trainings/participations/${id}`, participation);
    return response.data;
  },

  async deleteTrainingParticipation(id: string): Promise<void> {
    await api.delete(`/api/sst/trainings/participations/${id}`);
  },

  async getTrainingParticipationsByEmployee(employeeId: string): Promise<TrainingParticipation[]> {
    const response = await api.get(`/api/sst/trainings/participations/employee/${employeeId}`);
    return response.data;
  },

  async getExpiredOrExpiringTrainings(days: number = 30): Promise<TrainingParticipation[]> {
    const [expired, expiring] = await Promise.all([
      api.get<TrainingParticipation[]>('/api/sst/trainings/expired').then(r => r.data).catch(() => []),
      api.get<TrainingParticipation[]>(`/api/sst/trainings/expiring?daysAhead=${days}`).then(r => r.data).catch(() => []),
    ]);
    return [...expired, ...expiring];
  },

  // Acidentes
  async getAccidentRecords(): Promise<AccidentRecord[]> {
    const response = await api.get('/api/sst/accidents');
    return response.data;
  },

  async getAccidentRecordById(id: string): Promise<AccidentRecord> {
    const response = await api.get(`/api/sst/accidents/${id}`);
    return response.data;
  },

  async createAccidentRecord(accident: CreateAccidentRecordDTO): Promise<AccidentRecord> {
    const response = await api.post('/api/sst/accidents', accident);
    return response.data;
  },

  async updateAccidentRecord(id: string, accident: Partial<AccidentRecord>): Promise<AccidentRecord> {
    const response = await api.put(`/api/sst/accidents/${id}`, accident);
    return response.data;
  },

  async deleteAccidentRecord(id: string): Promise<void> {
    await api.delete(`/api/sst/accidents/${id}`);
  },

  async getAccidentRecordsByEmployee(employeeId: string): Promise<AccidentRecord[]> {
    const response = await api.get(`/api/sst/accidents/employee/${employeeId}`);
    return response.data;
  },

  async getAccidentRecordsByType(type: string): Promise<AccidentRecord[]> {
    const response = await api.get(`/api/sst/accidents/type/${type}`);
    return response.data;
  },

  async getAccidentRecordsByStatus(status: string): Promise<AccidentRecord[]> {
    const response = await api.get(`/api/sst/accidents/status/${status}`);
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
    const response = await api.get(`/api/sst/epis/${id}`);
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

  async verifyDeliveryByAlmoxarifado(id: string, userId?: string): Promise<EPIDelivery> {
    const response = await api.post(`/api/sst/epi-deliveries/${id}/verify-almoxarifado`, null, {
      params: userId ? { userId } : {}
    });
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
  },

  // Ações Corretivas
  async getCorrectiveActions(): Promise<CorrectiveAction[]> {
    const response = await api.get('/api/sst/corrective-actions');
    return response.data;
  },

  async getCorrectiveActionById(id: string): Promise<CorrectiveAction> {
    const response = await api.get(`/api/sst/corrective-actions/${id}`);
    return response.data;
  },

  async createCorrectiveAction(action: CreateCorrectiveActionDTO): Promise<CorrectiveAction> {
    const response = await api.post('/api/sst/corrective-actions', action);
    return response.data;
  },

  async updateCorrectiveAction(id: string, action: CreateCorrectiveActionDTO): Promise<CorrectiveAction> {
    const response = await api.put(`/api/sst/corrective-actions/${id}`, action);
    return response.data;
  },

  async completeCorrectiveAction(id: string): Promise<CorrectiveAction> {
    const response = await api.post(`/api/sst/corrective-actions/${id}/complete`);
    return response.data;
  },

  async deleteCorrectiveAction(id: string): Promise<void> {
    await api.delete(`/api/sst/corrective-actions/${id}`);
  },
};

