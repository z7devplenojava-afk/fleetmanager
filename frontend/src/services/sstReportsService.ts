import api from '@/lib/axios';

// Tipos para relatórios SST
export interface SSTReport {
  id: string;
  name: string;
  type: 'COMPLIANCE' | 'ACCIDENTS' | 'MEDICAL_EXAMS' | 'TRAINING' | 'EPI' | 'RISKS' | 'CUSTOM';
  description: string;
  parameters: ReportParameter[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'text' | 'number' | 'boolean';
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

export interface ReportExecution {
  id: string;
  reportId: string;
  reportName: string;
  parameters: Record<string, any>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result?: ReportResult;
  executedAt: string;
  executedBy: string;
  errorMessage?: string;
}

export interface ReportResult {
  data: any[];
  summary: ReportSummary;
  charts: ChartData[];
  totalRecords: number;
  executionTime: number;
}

export interface ReportSummary {
  totalEmployees: number;
  totalAccidents: number;
  totalExams: number;
  totalTrainings: number;
  totalEPIs: number;
  totalRisks: number;
  complianceRate: number;
  averageScore: number;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
    }[];
  };
}

export interface ReportRequest {
  reportId: string;
  parameters: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
}

// Serviço de Relatórios SST
export const sstReportsService = {
  // Relatórios
  async getReports(): Promise<SSTReport[]> {
    const response = await api.get('/api/sst/reports');
    return response.data;
  },

  async getReportById(id: string): Promise<SSTReport> {
    const response = await api.get(`/api/sst/reports/${id}`);
    return response.data;
  },

  async getReportsByType(type: string): Promise<SSTReport[]> {
    const response = await api.get(`/api/sst/reports/type/${type}`);
    return response.data;
  },

  async createReport(report: Partial<SSTReport>): Promise<SSTReport> {
    const response = await api.post('/api/sst/reports', report);
    return response.data;
  },

  async updateReport(id: string, report: Partial<SSTReport>): Promise<SSTReport> {
    const response = await api.put(`/api/sst/reports/${id}`, report);
    return response.data;
  },

  async deleteReport(id: string): Promise<void> {
    await api.delete(`/api/sst/reports/${id}`);
  },

  // Execução de Relatórios
  async executeReport(request: ReportRequest): Promise<ReportExecution> {
    const response = await api.post('/api/sst/reports/execute', request);
    return response.data;
  },

  async getReportExecutions(): Promise<ReportExecution[]> {
    const response = await api.get('/api/sst/reports/executions');
    return response.data;
  },

  async getReportExecutionById(id: string): Promise<ReportExecution> {
    const response = await api.get(`/api/sst/reports/executions/${id}`);
    return response.data;
  },

  async downloadReport(id: string): Promise<Blob> {
    const response = await api.get(`/api/sst/reports/executions/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Relatórios pré-definidos
  getDefaultReports(): Partial<SSTReport>[] {
    return [
      {
        name: 'Relatório de Conformidade SST',
        type: 'COMPLIANCE',
        description: 'Relatório geral de conformidade com as normas SST',
        parameters: [
          { name: 'startDate', label: 'Data Inicial', type: 'date', required: true },
          { name: 'endDate', label: 'Data Final', type: 'date', required: true },
          { name: 'department', label: 'Departamento', type: 'select', required: false, options: ['Todos', 'RH', 'Produção', 'Administrativo'] },
          { name: 'includeDetails', label: 'Incluir Detalhes', type: 'boolean', required: false, defaultValue: true }
        ],
        isActive: true
      },
      {
        name: 'Relatório de Acidentes',
        type: 'ACCIDENTS',
        description: 'Relatório detalhado de acidentes e quase acidentes',
        parameters: [
          { name: 'startDate', label: 'Data Inicial', type: 'date', required: true },
          { name: 'endDate', label: 'Data Final', type: 'date', required: true },
          { name: 'accidentType', label: 'Tipo de Acidente', type: 'select', required: false, options: ['Todos', 'COM_AFASTAMENTO', 'SEM_AFASTAMENTO', 'MORTAL', 'TRAJETO'] },
          { name: 'status', label: 'Status', type: 'select', required: false, options: ['Todos', 'REGISTRADO', 'INVESTIGADO', 'ENCERRADO'] },
          { name: 'includeInvestigation', label: 'Incluir Investigação', type: 'boolean', required: false, defaultValue: true }
        ],
        isActive: true
      },
      {
        name: 'Relatório de Exames Médicos',
        type: 'MEDICAL_EXAMS',
        description: 'Relatório de exames médicos e ASOs',
        parameters: [
          { name: 'startDate', label: 'Data Inicial', type: 'date', required: true },
          { name: 'endDate', label: 'Data Final', type: 'date', required: true },
          { name: 'examCategory', label: 'Categoria do Exame', type: 'select', required: false, options: ['Todas', 'ADMISSIONAL', 'PERIODICO', 'RETORNO', 'MUDANCA_FUNCAO', 'DEMISSIONAL'] },
          { name: 'status', label: 'Status', type: 'select', required: false, options: ['Todos', 'PENDENTE', 'REALIZADO', 'ATRASADO', 'CANCELADO'] },
          { name: 'includeExpired', label: 'Incluir Vencidos', type: 'boolean', required: false, defaultValue: false }
        ],
        isActive: true
      },
      {
        name: 'Relatório de Treinamentos',
        type: 'TRAINING',
        description: 'Relatório de treinamentos e capacitações',
        parameters: [
          { name: 'startDate', label: 'Data Inicial', type: 'date', required: true },
          { name: 'endDate', label: 'Data Final', type: 'date', required: true },
          { name: 'trainingType', label: 'Tipo de Treinamento', type: 'select', required: false, options: ['Todos', 'NR-35', 'NR-10', 'NR-12', 'NR-33', 'NR-11'] },
          { name: 'status', label: 'Status', type: 'select', required: false, options: ['Todos', 'AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'REPROVADO', 'CANCELADO'] },
          { name: 'includeExpired', label: 'Incluir Vencidos', type: 'boolean', required: false, defaultValue: false }
        ],
        isActive: true
      },
      {
        name: 'Relatório de EPIs',
        type: 'EPI',
        description: 'Relatório de equipamentos de proteção individual',
        parameters: [
          { name: 'startDate', label: 'Data Inicial', type: 'date', required: true },
          { name: 'endDate', label: 'Data Final', type: 'date', required: true },
          { name: 'category', label: 'Categoria', type: 'select', required: false, options: ['Todas', 'CABECA', 'OLHOS', 'AUDITIVO', 'RESPIRATORIO', 'MAOS', 'PES', 'CORPO'] },
          { name: 'includeExpired', label: 'Incluir Vencidos', type: 'boolean', required: false, defaultValue: false },
          { name: 'includeDeliveries', label: 'Incluir Entregas', type: 'boolean', required: false, defaultValue: true }
        ],
        isActive: true
      },
      {
        name: 'Relatório de Riscos Ocupacionais',
        type: 'RISKS',
        description: 'Relatório de riscos ocupacionais e análises',
        parameters: [
          { name: 'startDate', label: 'Data Inicial', type: 'date', required: true },
          { name: 'endDate', label: 'Data Final', type: 'date', required: true },
          { name: 'category', label: 'Categoria', type: 'select', required: false, options: ['Todas', 'FISICO', 'QUIMICO', 'BIOLOGICO', 'ERGONOMICO', 'ACIDENTE'] },
          { name: 'level', label: 'Nível de Risco', type: 'select', required: false, options: ['Todos', 'BAIXO', 'MEDIO', 'ALTO', 'CRITICO'] },
          { name: 'includeAssociations', label: 'Incluir Associações', type: 'boolean', required: false, defaultValue: true }
        ],
        isActive: true
      },
      {
        name: 'Dashboard Executivo SST',
        type: 'CUSTOM',
        description: 'Relatório executivo com indicadores principais',
        parameters: [
          { name: 'startDate', label: 'Data Inicial', type: 'date', required: true },
          { name: 'endDate', label: 'Data Final', type: 'date', required: true },
          { name: 'includeCharts', label: 'Incluir Gráficos', type: 'boolean', required: false, defaultValue: true },
          { name: 'includeTrends', label: 'Incluir Tendências', type: 'boolean', required: false, defaultValue: true },
          { name: 'includeComparisons', label: 'Incluir Comparações', type: 'boolean', required: false, defaultValue: true }
        ],
        isActive: true
      }
    ];
  },

  // Métodos auxiliares
  async getReportData(reportType: string, parameters: Record<string, any>): Promise<any> {
    const response = await api.post(`/api/sst/reports/data/${reportType}`, parameters);
    return response.data;
  },

  async getComplianceData(parameters: Record<string, any>): Promise<any> {
    return this.getReportData('compliance', parameters);
  },

  async getAccidentsData(parameters: Record<string, any>): Promise<any> {
    return this.getReportData('accidents', parameters);
  },

  async getMedicalExamsData(parameters: Record<string, any>): Promise<any> {
    return this.getReportData('medical-exams', parameters);
  },

  async getTrainingData(parameters: Record<string, any>): Promise<any> {
    return this.getReportData('training', parameters);
  },

  async getEPIData(parameters: Record<string, any>): Promise<any> {
    return this.getReportData('epi', parameters);
  },

  async getRisksData(parameters: Record<string, any>): Promise<any> {
    return this.getReportData('risks', parameters);
  }
};
